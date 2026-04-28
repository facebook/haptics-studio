/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {useState, useCallback} from 'react';
import Konva from 'konva';
import Constants from '../globals/constants';
import {useMouseEvent} from './useMouseEvent';
import {TimelineCursorType, TimeLineState} from '../state/types';

export interface BrushStateHook {
  /** The current selection (left or right handle, cursor body, or timeline click) */
  brushCursorType?: TimelineCursorType;
  /** Setter for the editor width */
  setEditorWidth: (width: number) => void;
  /** Set the selected cursor type. */
  setCursorSelection: (
    type: TimelineCursorType,
    e?: Konva.KonvaEventObject<MouseEvent>,
  ) => void;
  /** Action that changes the scroll position */
  scrollTimeline: (delta: number) => void;
  /** Action that changes the zoom level */
  zoomTimeline: (delta: number, centerIn: number | undefined) => void;
}

/**
 * Used to keep track of the brush scrolling. The state is held by the Editor instead of the Brush
 * to handle the mouse movement on all the editor area instead of a limited strip
 */
interface BrushCursorState {
  mousePosition?: number;
  movingCursorType?: TimelineCursorType;
}

/**
 * The metadata required by the brush to chek the zoom dimensions
 */
export interface BrushMetadata {
  // Width of the brush scrollbar
  width?: number;
  // The number of samples
  samples?: number;
}

interface Params {
  timelineState: TimeLineState;
  onTimelineChange: (
    timelineState: Partial<TimeLineState>,
    cursor: TimelineCursorType,
  ) => void;
}

/**
 * Keeps the brush scrolling state and handles the mouse input
 */
export default function useBrushState(params: Params): BrushStateHook {
  const {timelineState, onTimelineChange} = params;

  // Overflow holds the amount that the cursor traveled over the zoom size limit. When the cursor moves back will prevent the zoom to shrink before the mouse reaches the handle
  const [overflow, setOverflow] = useState(0);
  const [editorWidth, setEditorWidth] = useState(0);

  const [brushCursorState, setBrushCursorState] = useState<BrushCursorState>({
    mousePosition: undefined,
    movingCursorType: undefined,
  });

  const onMouseDown = useCallback(
    (e: MouseEvent) => {
      setBrushCursorState(prev => ({
        ...prev,
        mousePosition: e.clientX,
      }));
    },
    [],
  );
  useMouseEvent('mousedown', onMouseDown);

  /**
   * Updates the cursor position given a delta movement
   * @param type the handle grabbed by the user
   * @param delta the amount of movement on the X axis
   * @param ignoreOverflow the overflow is the amount of space traveled by the mouse after the cursor reached the view's bounds. When the mouse moves back, the overflow is decreased. The cursors moves only when overflow is 0. If `ignoreOverflow` is true, this check is skipped
   */
  const updateCursor = (
    type: TimelineCursorType,
    delta: number,
    ignoreOverflow = false,
  ) => {
    if (!editorWidth || !timelineState.duration) return;

    const durationPerSample =
      timelineState.duration / (timelineState.samples || 1);
    let start = timelineState.startTime - delta;
    let end = timelineState.endTime - delta;

    switch (type) {
      case TimelineCursorType.Left: {
        end = timelineState.endTime;
        if (
          timelineState.endTime - start >
          durationPerSample * Constants.timeline.maximumWindowSamples
        ) {
          // The mouse is moving too far from the zoom limit, we store the excess in the overflow
          if (!ignoreOverflow)
            setOverflow(
              overflow +
                Math.abs(
                  timelineState.endTime -
                    durationPerSample *
                      Constants.timeline.maximumWindowSamples -
                    start,
                ),
            );
          start =
            timelineState.endTime -
            durationPerSample * Constants.timeline.maximumWindowSamples;
        } else if (start <= 0) {
          // The mouse is moving too out of bounds, we store the excess in the overflow
          if (!ignoreOverflow) setOverflow(overflow + Math.abs(start));
        } else if (overflow > 0) {
          // If we have an overflow and the cursor is moving back, we decrease the overflow
          if (!ignoreOverflow) setOverflow(overflow - Math.abs(delta));
        }

        // Prevent the start handle from going over the end
        if (
          timelineState.endTime <=
          start + Constants.timeline.minimumZoomTime
        ) {
          start = end - Constants.timeline.minimumZoomTime;
          setOverflow(overflow + Math.abs(delta));
        }
        break;
      }
      case TimelineCursorType.Right: {
        start = timelineState.startTime;
        if (
          end - timelineState.startTime >
          durationPerSample * Constants.timeline.maximumWindowSamples
        ) {
          // Same overflow logic applies for the left handle
          if (!ignoreOverflow)
            setOverflow(
              overflow +
                Math.abs(
                  timelineState.startTime +
                    durationPerSample *
                      Constants.timeline.maximumWindowSamples -
                    end,
                ),
            );
          end =
            timelineState.startTime +
            durationPerSample * Constants.timeline.maximumWindowSamples;
        } else if (end >= timelineState.duration) {
          if (!ignoreOverflow)
            setOverflow(overflow + Math.abs(timelineState.duration - end));
        } else if (overflow > 0) {
          if (!ignoreOverflow) setOverflow(overflow - Math.abs(delta));
        }

        // Prevent the end handle to go below the start
        if (
          timelineState.startTime >=
          end - Constants.timeline.minimumZoomTime
        ) {
          end = start + Constants.timeline.minimumZoomTime;
          setOverflow(overflow + Math.abs(delta));
        }
        break;
      }
      case TimelineCursorType.Center: {
        const brushSize = timelineState.endTime - timelineState.startTime;

        if (start < 0) {
          if (!ignoreOverflow) setOverflow(overflow + Math.abs(start));
          start = 0;
          end = brushSize;
        } else if (end > timelineState.duration) {
          // TODO: improve the anchor point for the center handle when the mouse goes offscreen
          if (!ignoreOverflow)
            setOverflow(overflow + Math.abs(timelineState.duration - end));
          onTimelineChange(
            {startTime: end - brushSize, endTime: end, duration: end},
            type,
          );
        } else if (overflow > 0) {
          if (!ignoreOverflow) setOverflow(overflow - Math.abs(delta));
        }
        break;
      }
      default:
        break;
    }

    if (overflow <= 0 || ignoreOverflow) {
      onTimelineChange({startTime: start < 0 ? 0 : start, endTime: end}, type);
    }
  };

  const onMouseMove = useCallback(
    (event: MouseEvent) => {
      if (
        brushCursorState.movingCursorType === undefined ||
        brushCursorState.mousePosition === undefined ||
        !editorWidth ||
        !timelineState.duration
      )
        return;

      const delta =
        ((brushCursorState.mousePosition - event.clientX) / editorWidth) *
        timelineState.duration;

      updateCursor(brushCursorState.movingCursorType, delta);

      setBrushCursorState({
        ...brushCursorState,
        mousePosition: event.clientX,
      });
    },
    [brushCursorState, editorWidth, timelineState.duration],
  );
  useMouseEvent('mousemove', onMouseMove);

  const scrollTimeline = (delta: number) => {
    updateCursor(TimelineCursorType.Center, delta, true);
  };

  const zoomTimeline = (delta: number, centerIn = 0.5) => {
    if (!editorWidth || !timelineState.duration) return;

    const duration = timelineState.endTime - timelineState.startTime;
    const center = timelineState.startTime + duration / 2;

    const durationPerSample =
      timelineState.duration / (timelineState.samples || 1);
    // Increase/decrease the window by adding delta on both directions
    let start = timelineState.startTime - delta * (centerIn || 1) * duration;
    let end =
      timelineState.endTime + delta * (centerIn ? 1 - centerIn : 1) * duration;

    // When the zoom is too low, keep the window steady by setting both the start and end to the midway point
    if (start >= end || end - start < Constants.timeline.minimumZoomTime) {
      onTimelineChange(
        {
          startTime: center - Constants.timeline.minimumZoomTime / 2,
          endTime: center + Constants.timeline.minimumZoomTime / 2,
        },
        TimelineCursorType.Center,
      );
      return;
    }

    // Check all possible bounds
    if (
      timelineState.endTime - start >
      durationPerSample * Constants.timeline.maximumWindowSamples
    ) {
      start =
        timelineState.endTime -
        durationPerSample * Constants.timeline.maximumWindowSamples;
    }
    if (start <= 0) {
      start = 0;
    }
    if (
      end - timelineState.startTime >
      durationPerSample * Constants.timeline.maximumWindowSamples
    ) {
      end =
        timelineState.startTime +
        durationPerSample * Constants.timeline.maximumWindowSamples;
    }
    if (end >= timelineState.duration) {
      end = timelineState.duration;
    }
    if (start > end) {
      start = end;
    }

    onTimelineChange(
      {startTime: start, endTime: end},
      TimelineCursorType.Center,
    );
  };

  const onCenter = (x: number) => {
    if (!editorWidth || !timelineState.duration) return;

    // Get the midway point, set the start to that point - half duration, the end to that point + half duration
    const time = (x / editorWidth) * timelineState.duration;
    const duration = timelineState.endTime - timelineState.startTime;
    let start = time - duration / 2;
    let end = time + duration / 2;
    if (start < 0) {
      end -= start;
      start = 0;
    }
    if (end > timelineState.duration) {
      start -= end - timelineState.duration;
      end = timelineState.duration;
    }

    onTimelineChange(
      {startTime: start, endTime: end},
      TimelineCursorType.Center,
    );
  };

  const onMouseUp = useCallback(() => {
    setBrushCursorState({
      mousePosition: undefined,
      movingCursorType: undefined,
    });
    setOverflow(0);
  }, []);
  useMouseEvent('mouseup', onMouseUp);
  useMouseEvent('mouseleave', onMouseUp);

  const setCursorSelection = (
    type: TimelineCursorType,
    e?: Konva.KonvaEventObject<MouseEvent>,
  ) => {
    if (type === TimelineCursorType.Outside && e) {
      onCenter(e.currentTarget.getStage()?.getPointerPosition()?.x || 0);
      return;
    }

    setBrushCursorState({
      movingCursorType: type,
    });
  };

  return {
    setEditorWidth,
    brushCursorType: brushCursorState.movingCursorType,
    setCursorSelection,
    scrollTimeline,
    zoomTimeline,
  };
}
