/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useState, useRef, useCallback} from 'react';
import {Stage, Layer, Rect, Group} from 'react-konva';
import Konva from 'konva';
import {Html} from 'react-konva-utils';

import Constants from '../../../globals/constants';
import {useMouseEvent} from '../../../hooks/useMouseEvent';
import {timeToScreen} from '../../../globals/utils';
import Plot from './Plot';
import {useKeyboardEvent} from '../../../hooks/useKeyboardEvent';
import {
  EditorPointData,
  EnvelopeType,
  Position,
  TimeLineState,
} from '../../../state/types';
import {useRenderMetadata} from '../../../hooks/useRenderMetadata';
import TimeLabel from '../../common/TimeLabel';

interface PasteEditorProps {
  width: number;
  height: number;
  type: EnvelopeType;
  data: {amplitude: Array<EditorPointData>; frequency: Array<EditorPointData>};
  // Brush
  timeline: TimeLineState;
  offset: number;
  setOffset: (offset: number) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Overlay that show the paste data and let the user drag it around
 */
function PasteEditor(props: PasteEditorProps) {
  const [mousePosition, setMousePosition] = useState<Position>();
  const [isMoving, setIsMoving] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  const {
    width,
    height,
    type,
    data,
    timeline,
    offset,
    setOffset,
    onCancel,
    onConfirm,
  } = props;

  if (
    width === 0 ||
    (data.amplitude.length === 0 && data.frequency.length === 0)
  ) {
    return null;
  }

  const renderMetadata = useRenderMetadata(width, height, timeline, {
    excludeBottomMargin: true,
  });

  const clipboardDuration =
    data.amplitude[data.amplitude.length - 1].x - data.amplitude[0].x;
  const clipboardWidth =
    (clipboardDuration / renderMetadata.duration) * renderMetadata.width;

  const onAreaMouseDown = () => {
    onConfirm();
  };

  const onRectMouseDown = (event: Konva.KonvaEventObject<MouseEvent>) => {
    setIsMoving(true);
    setMousePosition({x: event.evt.clientX, y: event.evt.clientY});
  };

  const mouseMove = useCallback(
    (event: MouseEvent) => {
      if (!mousePosition || !isMoving) return;

      const newOffset =
        offset +
        ((event.clientX - mousePosition.x) / renderMetadata.width) *
          renderMetadata.duration;

      // Move the clip, and make sure it does not go above or below the file waveform
      setOffset(newOffset);

      setMousePosition({x: event.clientX, y: event.clientY});
    },
    [mousePosition, timeline],
  );
  useMouseEvent('mousemove', mouseMove);

  const mouseUp = useCallback(() => {
    setIsMoving(false);
  }, [isMoving]);
  useMouseEvent('mouseup', mouseUp);

  const keyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
      if (e.key === 'Enter') {
        onConfirm();
      }
    },
    [mousePosition],
  );
  useKeyboardEvent('keydown', keyDown);

  const onTrimTimelineClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.evt.stopPropagation();
    const x = (e.evt as any).layerX;
    const w = width - Constants.plot.margin.right - Constants.plot.margin.left;
    setOffset(
      timeline.startTime +
        ((x - Constants.plot.margin.left) / w) *
          (timeline.endTime - timeline.startTime),
    );
  };

  // The paste data has time information relative to the source, this will scale it back to 0 and move it by the offset set by the user
  const startingPoint = data.amplitude[0].x;
  const scaledAmplitude = data.amplitude.map(p => {
    return {...p, x: p.x - startingPoint + offset};
  });
  const scaledFrequency = data.frequency.map(p => {
    return {...p, x: p.x - startingPoint + offset};
  });
  const offsetPosition = Math.min(
    timeToScreen({x: offset, y: 0}, renderMetadata).x,
    renderMetadata.width,
  );

  return (
    <div ref={container as any}>
      <Stage width={width} height={height}>
        <Layer x={Constants.plot.margin.left} y={Constants.plot.margin.top}>
          <Group
            clipFunc={(ctx: any) => {
              // Clip the plot that can overflow in the gutters
              ctx.beginPath();
              ctx.rect(0, 0, renderMetadata.width, height);
              ctx.closePath();
            }}>
            <Rect
              width={width}
              height={renderMetadata.height}
              fill="#ffffff00"
              onMouseDown={onAreaMouseDown}
            />

            <Rect
              x={offsetPosition - Constants.plot.point.radius}
              width={clipboardWidth + Constants.plot.point.radius * 2}
              height={renderMetadata.height - Constants.plot.margin.bottom}
              fill="#000"
              opacity={0.3}
            />

            <Plot
              width={width}
              height={height}
              data={
                type === EnvelopeType.Amplitude
                  ? scaledFrequency
                  : scaledAmplitude
              }
              timeline={timeline}
              type={
                type === EnvelopeType.Amplitude
                  ? EnvelopeType.Frequency
                  : EnvelopeType.Amplitude
              }
              offset={offset}
            />

            <Plot
              width={width}
              height={height}
              data={
                type === EnvelopeType.Amplitude
                  ? scaledAmplitude
                  : scaledFrequency
              }
              timeline={timeline}
              type={type}
              offset={offset}
            />

            <Rect
              x={offsetPosition - Constants.plot.point.radius}
              y={0}
              width={clipboardWidth + Constants.plot.point.radius * 2}
              height={renderMetadata.height - Constants.plot.margin.bottom}
              stroke="#ffffff99"
              strokeWidth={1}
              dash={[10, 10]}
              fill="#00000000"
              onMouseDown={onRectMouseDown}
            />
          </Group>
          <Group
            x={Math.max(offsetPosition - 4, Constants.plot.margin.left)}
            y={-48}>
            <Html>
              <div style={{transform: 'translate(-50%, 0)'}}>
                <TimeLabel
                  time={Math.max(offset, 0)}
                  onCancel={() => onCancel()}
                  onConfirm={() => onConfirm()}
                />
              </div>
            </Html>
          </Group>
        </Layer>
        <Layer>
          <Rect
            x={Constants.plot.margin.left}
            y={
              Constants.plot.margin.top - Constants.plot.grid.markersArea.height
            }
            width={width}
            height={Constants.plot.grid.markersArea.height}
            fill="#00000033"
            onMouseDown={onTrimTimelineClick}
          />
        </Layer>
      </Stage>
    </div>
  );
}

export default React.memo(PasteEditor);
