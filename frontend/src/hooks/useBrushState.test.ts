/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {renderHook, act} from '@testing-library/react-hooks';
import {toMatchCloseTo} from 'jest-matcher-deep-close-to';
import {fireEvent} from '@testing-library/react';
import {cleanup} from '../test-utils';
import useBrushState from './useBrushState';
import {TimelineCursorType, TimeLineState} from '../state/types';
import Constants from '../globals/constants';

expect.extend({toMatchCloseTo});

afterEach(cleanup);

const Duration = 10;
const Samples = 100;
const EditorWidth = 1000;

describe('useBrushState', () => {
  test('should limit the brush zoom size to its maximum when pulling from the right', () => {
    const defaultTimeLineState: TimeLineState = {
      startTime: 0,
      endTime: 0.1,
      duration: 0.1,
      samples: 10,
    };

    const changeMock = jest.fn();

    const {result} = renderHook(() =>
      useBrushState({
        timelineState: defaultTimeLineState,
        onTimelineChange: changeMock,
      }),
    );

    const move = new MouseEvent('mousemove', {
      clientX: 1000,
    });

    void act(() => {
      result.current.setEditorWidth(EditorWidth);
    });
    void act(() => {
      result.current.setCursorSelection(TimelineCursorType.Right);
    });
    void act(() => {
      window.dispatchEvent(new MouseEvent('mousedown', {clientX: 0}));
    });
    void act(() => {
      fireEvent(window, move);
    });

    expect(changeMock).toHaveBeenCalledWith(
      {startTime: 0, endTime: 0.2},
      TimelineCursorType.Right,
    );
  });

  test('should increase the clip duration when the cursor reaches the right limit', () => {
    const defaultTimeLineState: TimeLineState = {
      startTime: 0,
      endTime: 0.1,
      duration: 0.1,
      samples: 10,
    };

    let resultTimeLineState: Partial<TimeLineState> = {...defaultTimeLineState};

    const {result} = renderHook(() =>
      useBrushState({
        timelineState: defaultTimeLineState,
        onTimelineChange: newState => {
          resultTimeLineState = {...resultTimeLineState, ...newState};
        },
      }),
    );

    const move = new MouseEvent('mousemove', {
      clientX: 200,
    });

    void act(() => {
      result.current.setEditorWidth(EditorWidth);
    });
    void act(() => {
      result.current.setCursorSelection(TimelineCursorType.Center);
    });
    void act(() => {
      window.dispatchEvent(new MouseEvent('mousedown', {clientX: 0}));
    });
    void act(() => {
      fireEvent(window, move);
    });

    const expectedDelta =
      (move.clientX / EditorWidth) * defaultTimeLineState.duration;

    expect(resultTimeLineState.startTime).toBeCloseTo(expectedDelta);
    expect(resultTimeLineState.endTime).toBeCloseTo(
      defaultTimeLineState.endTime + expectedDelta,
    );
    expect(resultTimeLineState.duration).toBeCloseTo(
      defaultTimeLineState.duration + expectedDelta,
    );
  });

  test('should limit the zoom size to its maximum when pulling from the left', () => {
    const defaultTimeLineState: TimeLineState = {
      startTime: 8,
      endTime: 10,
      duration: Duration,
      samples: Samples,
    };

    let resultTimeLineState: Partial<TimeLineState> = {...defaultTimeLineState};

    const {result} = renderHook(() =>
      useBrushState({
        timelineState: defaultTimeLineState,
        onTimelineChange: newState => {
          resultTimeLineState = {...resultTimeLineState, ...newState};
        },
      }),
    );

    const moveLeft = new MouseEvent('mousemove', {
      clientX: -EditorWidth,
    });

    void act(() => {
      result.current.setEditorWidth(EditorWidth);
    });
    void act(() => {
      result.current.setCursorSelection(TimelineCursorType.Left);
    });
    void act(() => {
      window.dispatchEvent(new MouseEvent('mousedown', {clientX: 0}));
    });
    void act(() => {
      fireEvent(window, moveLeft);
    });

    expect(resultTimeLineState.startTime).toEqual(
      Math.max(
        Duration -
          (Duration / Samples) * Constants.timeline.maximumWindowSamples,
        0,
      ),
    );
    expect(resultTimeLineState.endTime).toEqual(Duration);
  });

  test('should move the cursor when zooming in', () => {
    const defaultTimeLineState: TimeLineState = {
      startTime: 0,
      endTime: 0.1,
      duration: Duration,
      samples: Samples,
    };

    let resultTimeLineState: Partial<TimeLineState> = {...defaultTimeLineState};

    const {result} = renderHook(() =>
      useBrushState({
        timelineState: defaultTimeLineState,
        onTimelineChange: newState => {
          resultTimeLineState = {...resultTimeLineState, ...newState};
        },
      }),
    );

    void act(() => {
      result.current.setEditorWidth(EditorWidth);
    });

    const duration =
      defaultTimeLineState.endTime - defaultTimeLineState.startTime;
    const end = defaultTimeLineState.endTime;

    void act(() => {
      result.current.zoomTimeline(0.2, 0);
    });

    expect(resultTimeLineState.startTime).toEqual(0);
    expect(resultTimeLineState.endTime).toEqual(end + 0.2 * duration);
  });

  test('should move the cursor when zooming out', () => {
    const defaultTimeLineState: TimeLineState = {
      startTime: 0,
      endTime: 1,
      duration: Duration,
      samples: Samples,
    };

    let resultTimeLineState: Partial<TimeLineState> = {...defaultTimeLineState};

    const {result} = renderHook(() =>
      useBrushState({
        timelineState: defaultTimeLineState,
        onTimelineChange: newState => {
          resultTimeLineState = {...resultTimeLineState, ...newState};
        },
      }),
    );

    void act(() => {
      result.current.setEditorWidth(EditorWidth);
    });
    void act(() => {
      result.current.zoomTimeline(-0.2, 0);
    });

    expect(resultTimeLineState.startTime).toEqual(0.2);
    expect(resultTimeLineState.endTime).toEqual(
      defaultTimeLineState.endTime - 0.2,
    );
  });

  test('should center the view when clicking on the timeline outside the cursor', () => {
    const defaultTimeLineState: TimeLineState = {
      startTime: 0,
      endTime: 1,
      duration: Duration,
      samples: Samples,
    };

    let resultTimeLineState: Partial<TimeLineState> = {...defaultTimeLineState};

    const {result} = renderHook(() =>
      useBrushState({
        timelineState: defaultTimeLineState,
        onTimelineChange: newState => {
          resultTimeLineState = {...resultTimeLineState, ...newState};
        },
      }),
    );

    const eventMock = {
      currentTarget: {
        getStage: () => ({getPointerPosition: () => ({x: EditorWidth - 1})}),
      },
    };

    void act(() => {
      result.current.setEditorWidth(EditorWidth);
    });
    void act(() => {
      result.current.setCursorSelection(
        TimelineCursorType.Outside,
        eventMock as any,
      );
    });

    expect(resultTimeLineState.startTime).toEqual(Duration - 1);
    expect(resultTimeLineState.endTime).toEqual(Duration);
  });
});
