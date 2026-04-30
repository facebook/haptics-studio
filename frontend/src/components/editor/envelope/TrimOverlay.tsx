/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Konva from 'konva';
import {Group, Layer, Line, Rect, Stage} from 'react-konva';
import {Html} from 'react-konva-utils';

import {createAppStyle, theme} from '../../../styles/theme.style';
import {Clip} from '../../../state/types';
import Constants from '../../../globals/constants';
import {timeToScreen} from '../../../globals/utils';
import {useMouseEvent} from '../../../hooks/useMouseEvent';
import HoverCursor from '../../common/HoverCursor';
import TimeLabel from '../../common/TimeLabel';

const useStyles = createAppStyle({
  container: {
    position: 'absolute',
    display: 'flex',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
});

interface Props {
  width: number;
  height: number;
  clip: Clip;
  isTrimming: boolean;
  trimTime: number | undefined;
  onTrimMove: (time: number | undefined) => void;
  onTrimConfirm: () => void;
}

/**
 * Overlay with trim indicator
 */
function TrimOverlay(props: Props) {
  const {width, height, clip, trimTime, isTrimming, onTrimMove, onTrimConfirm} =
    props;
  const classes = useStyles();
  const [isDraggingTrim, setIsDraggingTrim] = React.useState(false);

  const onMouseUp = React.useCallback(() => {
    setIsDraggingTrim(false);
  }, []);
  useMouseEvent('mouseup', onMouseUp);

  const onTrimCursorClick = () => {
    setIsDraggingTrim(true);
  };

  const moveTrimPosition = (x: number) => {
    const {timeline} = clip;
    if (!timeline) return;
    const w = width - Constants.plot.margin.right - Constants.plot.margin.left;
    onTrimMove(
      timeline.startTime +
        ((x - Constants.plot.margin.left) / w) *
          (timeline.endTime - timeline.startTime),
    );
  };

  const onTrimTimelineClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isTrimming) {
      e.evt.stopPropagation();
      moveTrimPosition((e.evt as any).layerX);
    }
  };

  const onMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isDraggingTrim && isTrimming) {
      e.evt.stopPropagation();
      moveTrimPosition((e.evt as any).layerX);
    }
  };

  const trimX: number = React.useMemo(() => {
    if (clip.timeline && trimTime !== undefined) {
      const renderMetadata = {
        width: width - Constants.plot.margin.right - Constants.plot.margin.left,
        height,
        duration: clip.timeline.endTime - clip.timeline.startTime,
        startTime: clip.timeline.startTime,
        margin: Constants.plot.margin,
      };
      return timeToScreen({x: trimTime, y: 0}, renderMetadata).x;
    }
    return 0;
  }, [clip, width, height, trimTime]);

  const styleOverrides: React.CSSProperties = {};
  if (!isTrimming) {
    styleOverrides.pointerEvents = 'none';
  }
  if (isDraggingTrim) {
    styleOverrides.cursor = 'col-resize';
  }

  return (
    <div className={classes.container} style={styleOverrides}>
      <Stage
        x={Constants.plot.margin.left}
        y={0}
        width={width}
        height={height}
        onMouseMove={onMouseMove}>
        <Layer
          name="trim-overlay"
          clipFunc={(ctx: Konva.Context) => {
            ctx.beginPath();
            ctx.rect(
              0,
              0,
              width - Constants.plot.margin.right - Constants.plot.margin.left,
              height,
            );
            ctx.closePath();
          }}>
          <Rect
            x={trimX}
            y={
              Constants.plot.margin.top - Constants.plot.grid.markersArea.height
            }
            width={
              width -
              trimX -
              Constants.plot.margin.right -
              Constants.plot.margin.left
            }
            height={
              height -
              Constants.plot.margin.bottom -
              Constants.plot.margin.top +
              Constants.plot.grid.markersArea.height
            }
            fill="#00000033"
            listening={false}
          />
          <Line
            x={trimX}
            y={Constants.plot.margin.top}
            points={[
              0,
              0,
              0,
              height - Constants.plot.margin.bottom - Constants.plot.margin.top,
            ]}
            stroke={theme.colors.primary.main}
            strokeWidth={2}
            listening={false}
          />

          {isTrimming ? (
            <Rect
              x={0}
              y={
                Constants.plot.margin.top -
                Constants.plot.grid.markersArea.height
              }
              width={Math.min(trimX, width)}
              height={Constants.plot.grid.markersArea.height}
              fill="#ffffff33"
            />
          ) : null}
          {isTrimming ? (
            <Rect
              x={0}
              y={
                Constants.plot.margin.top -
                Constants.plot.grid.markersArea.height
              }
              width={width}
              height={Constants.plot.grid.markersArea.height}
              fill="#ffffff00"
              onMouseDown={onTrimTimelineClick}
            />
          ) : null}
          {isTrimming && trimTime !== undefined && trimX < width ? (
            <Group>
              <HoverCursor type="grab">
                <Rect
                  x={trimX - 4}
                  y={
                    Constants.plot.margin.top -
                    Constants.plot.grid.markersArea.height
                  }
                  width={8}
                  height={Constants.plot.grid.markersArea.height}
                  fill="#fff"
                  cornerRadius={2}
                  onMouseDown={onTrimCursorClick}
                />
              </HoverCursor>
              <Rect
                x={trimX - 0.5}
                y={
                  Constants.plot.margin.top -
                  Constants.plot.grid.markersArea.height / 2 -
                  2
                }
                width={1}
                height={4}
                fill="#000"
                listening={false}
              />
              <HoverCursor type="grab">
                <Rect
                  x={trimX - 4}
                  y={
                    (height - Constants.plot.margin.bottom) / 2 +
                    Constants.plot.grid.markersArea.height
                  }
                  width={8}
                  height={Constants.plot.grid.markersArea.height}
                  fill="#fff"
                  cornerRadius={2}
                  onMouseDown={onTrimCursorClick}
                />
              </HoverCursor>
              <Rect
                x={trimX - 0.5}
                y={height / 2 + Constants.plot.grid.markersArea.height + 2}
                width={1}
                height={4}
                fill="#000"
                listening={false}
              />
              <Group x={trimX - 4} y={0}>
                <Html>
                  <div style={{transform: 'translate(-50%, 8px)'}}>
                    <TimeLabel
                      time={trimTime}
                      onCancel={() => onTrimMove(undefined)}
                      onConfirm={() => onTrimConfirm()}
                    />
                  </div>
                </Html>
              </Group>
            </Group>
          ) : undefined}
        </Layer>
      </Stage>
    </div>
  );
}

export default React.memo(TrimOverlay);
