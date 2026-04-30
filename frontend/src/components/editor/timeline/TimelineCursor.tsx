/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Konva from 'konva';
import {Stage, Layer, Rect, Line} from 'react-konva';

import HoverCursor from '../../common/HoverCursor';
import Constants from '../../../globals/constants';
import {theme} from '../../../styles/theme.style';
import {
  RenderSize,
  TimelineCursorType,
  TimeLineState,
} from '../../../state/types';

interface Props {
  renderSize: RenderSize;
  timeline: TimeLineState;
  isTrimming: boolean;
  trimTime: number | undefined;
  onSelection: (
    type: TimelineCursorType,
    e: Konva.KonvaEventObject<MouseEvent>,
  ) => void;
}

function TimelineCursor(props: Props) {
  const {renderSize, timeline, isTrimming, trimTime, onSelection} = props;

  const innerWidth =
    renderSize.width - renderSize.margin.left - renderSize.margin.right;
  const innerHeight =
    renderSize.height - renderSize.margin.top - renderSize.margin.bottom;

  const trimPosition =
    timeline.duration > 0
      ? ((trimTime ?? 0) / timeline.duration) * innerWidth
      : 0;

  const cursor = {
    x:
      timeline.duration > 0
        ? (timeline.startTime / timeline.duration) * innerWidth
        : 0,
    width:
      timeline.duration > 0
        ? Math.max(
            ((timeline.endTime - timeline.startTime) / timeline.duration) *
              innerWidth,
            Constants.timeline.minimumCursorSize,
          )
        : 0,
  };

  if (renderSize.width === 0) {
    return null;
  }

  return (
    <Stage
      x={renderSize.margin.left}
      y={renderSize.margin.top}
      width={renderSize.width}
      height={renderSize.height}>
      <Layer name="background">
        <Rect
          width={innerWidth}
          height={innerHeight}
          fill="#0000"
          onMouseDown={onSelection.bind(null, TimelineCursorType.Outside)}
        />
      </Layer>

      {trimTime ? (
        <Layer name="trim-fade">
          <Rect
            listening={false}
            x={trimPosition}
            width={innerWidth - trimPosition}
            height={innerHeight}
            fill="#2229"
            onMouseDown={
              !isTrimming
                ? onSelection.bind(null, TimelineCursorType.Outside)
                : () => {}
            }
          />
        </Layer>
      ) : null}

      {
        <Layer name="navigation">
          {/* Cursor - Center */}
          <HoverCursor type="grab">
            <Rect
              x={cursor.x}
              width={cursor.width}
              height={innerHeight}
              fill={theme.colors.plot.brushFill}
              cornerRadius={Constants.timeline.borderRadius}
              onMouseDown={onSelection.bind(null, TimelineCursorType.Center)}
            />
          </HoverCursor>
          {/* Cursor - Left Handle */}
          <HoverCursor type="w-resize">
            <Rect
              listening={false}
              x={cursor.x - 2}
              y={innerHeight / 2 - 14}
              width={4}
              height={28}
              cornerRadius={4}
              fill={theme.colors.plot.brushHandle}
            />
            <Rect
              x={cursor.x - Constants.timeline.handleSize * 0.5}
              y={1}
              width={Constants.timeline.handleSize}
              height={innerHeight - 2}
              fill="#0000"
              onMouseDown={onSelection.bind(null, TimelineCursorType.Left)}
            />
          </HoverCursor>
          {/* Cursor - Right Handle */}
          <HoverCursor type="e-resize">
            <Rect
              listening={false}
              x={cursor.x + cursor.width - 2}
              y={innerHeight / 2 - 14}
              width={4}
              height={28}
              cornerRadius={4}
              fill={theme.colors.plot.brushHandle}
            />
            <Rect
              x={cursor.x + cursor.width - Constants.timeline.handleSize * 0.5}
              y={1}
              width={Constants.timeline.handleSize}
              height={innerHeight - 2}
              fill="#0000"
              onMouseDown={onSelection.bind(null, TimelineCursorType.Right)}
            />
          </HoverCursor>
        </Layer>
      }

      {isTrimming || trimTime ? (
        <Layer name="trim">
          <Line
            x={trimPosition}
            y={0}
            points={[0, 2, 0, innerHeight - 2]}
            stroke="#fff"
            strokeWidth={1}
          />
        </Layer>
      ) : null}
    </Stage>
  );
}

export default React.memo(TimelineCursor);
