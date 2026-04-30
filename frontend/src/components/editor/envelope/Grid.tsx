/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Konva from 'konva';

import {Layer, Line, Rect, Group, Text} from 'react-konva';
import Constants from '../../../globals/constants';
import {theme} from '../../../styles/theme.style';
import {timeFormat} from '../../../globals/utils';
import {TimeLineState} from '../../../state/types';
import {Tool} from '../../../state/editingTools/types';

interface Props {
  width: number;
  height: number;
  timeline: TimeLineState;
  activeTool: Tool;
}

/**
 * Renders the Audio Envelope static polygon and the base grid
 */
function Grid(props: Props): JSX.Element | null {
  const {width, height, timeline, activeTool} = props;

  const duration = timeline.endTime - timeline.startTime;
  const plotSize = {
    width: width - Constants.plot.margin.horizontal(),
    height: height - Constants.plot.margin.vertical(),
  };

  // Determine the amount of vertical grid division to show, based on the zoom level
  let tickDuration = Constants.plot.grid.minimumTimeSpan;
  let horizontalSubdivisions = Math.ceil(duration / tickDuration);
  // If too many ticks are visible, increase their span
  while (horizontalSubdivisions > Constants.plot.grid.maximumTicks) {
    tickDuration += Constants.plot.grid.minimumTimeSpan;
    horizontalSubdivisions = Math.ceil(duration / tickDuration);
  }

  // The x coordinate of the first vertical grid line
  const firstHorizontalSubdivision =
    (Math.floor(timeline.startTime / tickDuration) + 1) * tickDuration;

  if (width === 0) {
    return null;
  }

  // The unlabelled vertical grid lines are twice as many as the labelled ones
  const verticalSubdivisions = Constants.plot.grid.verticalSubdivisions * 2;

  const timeLabel = (time: number) => {
    if (!duration) return null;
    const x =
      ((firstHorizontalSubdivision + time - timeline.startTime) *
        plotSize.width) /
      duration;

    return (
      <Text
        key={`time-label-${time}`}
        x={x - 25}
        y={20}
        align="center"
        fontFamily={theme.fonts.body}
        fontSize={11}
        text={timeFormat(firstHorizontalSubdivision + time)}
        fill={theme.colors.plot.grid}
        width={50}
      />
    );
  };

  return (
    <Layer name="grid">
      <Group
        listening={false}
        clipFunc={(ctx: Konva.Context) => {
          // Clip the time ticks that can overflow in the gutters
          ctx.beginPath();
          ctx.rect(Constants.plot.margin.left - 1, 0, plotSize.width, height);
          ctx.closePath();
        }}>
        {/* Axis */}
        <Line
          x={Constants.plot.margin.left}
          y={Constants.plot.margin.top}
          points={[
            plotSize.width,
            0,
            0,
            0,
            0,
            plotSize.height,
            plotSize.width,
            plotSize.height,
          ]}
          stroke={theme.colors.plot.grid}
          strokeWidth={1}
        />

        {/* Horizontal grid lines */}
        <Group
          name="horizontal-grid-lines"
          x={Constants.plot.margin.left}
          y={Constants.plot.margin.top}>
          {[...Array(verticalSubdivisions)].map((_, idx) => {
            return (
              <Line
                key={`horizontal-marker-${idx}`}
                dash={[2, 4]}
                points={[
                  0,
                  (plotSize.height / verticalSubdivisions) * idx,
                  plotSize.width,
                  (plotSize.height / verticalSubdivisions) * idx,
                ]}
                stroke={theme.colors.plot.grid}
                strokeWidth={1}
              />
            );
          })}
        </Group>

        {/* Vertical grid lines */}
        <Group
          name="vertical-grid-lines"
          x={Constants.plot.margin.left}
          y={Constants.plot.margin.top}>
          {[...Array(horizontalSubdivisions)].map((_, idx) => {
            if (!duration) return null;
            const x =
              ((firstHorizontalSubdivision +
                idx * tickDuration -
                timeline.startTime) *
                plotSize.width) /
              duration;
            return (
              <Line
                points={[x, 0, x, plotSize.height]}
                stroke={theme.colors.plot.grid}
                strokeWidth={1}
                key={`vertical-marker-${idx}`}
              />
            );
          })}
        </Group>
        <Group name="timeline-ticks" x={Constants.plot.margin.left}>
          {activeTool === Tool.Markers ? (
            <Rect
              name="markers-background"
              y={
                Constants.plot.margin.top -
                Constants.plot.grid.markersArea.height
              }
              width={width}
              height={Constants.plot.grid.markersArea.height}
              fill={theme.colors.plot.markerGutter}
            />
          ) : null}
          {timeline.startTime === 0 ? (
            <Line
              points={[
                0,
                Constants.plot.margin.top,
                0,
                Constants.plot.margin.top -
                  Constants.plot.grid.markersArea.height,
              ]}
              stroke={theme.colors.plot.grid}
              strokeWidth={1}
            />
          ) : null}
          {[...Array(horizontalSubdivisions + 3)].map((_, idx) => {
            if (!duration) return null;
            const x =
              ((firstHorizontalSubdivision +
                idx * tickDuration -
                timeline.startTime) *
                plotSize.width) /
              duration;
            return (
              <Group key={`time-marker-${idx}`}>
                <Line
                  points={[
                    x,
                    Constants.plot.margin.top,
                    x,
                    Constants.plot.margin.top -
                      Constants.plot.grid.markersArea.height,
                  ]}
                  stroke={theme.colors.plot.grid}
                  strokeWidth={1}
                />
                {[...Array(Constants.plot.grid.subTicksCount)].map((__, i) => {
                  const subX =
                    x -
                    (((tickDuration / Constants.plot.grid.subTicksCount) *
                      plotSize.width) /
                      duration) *
                      i;
                  const tickSize =
                    i === Constants.plot.grid.subTicksCount / 2 ? 10 : 5;
                  return (
                    <Line
                      points={[
                        subX,
                        Constants.plot.margin.top,
                        subX,
                        Constants.plot.margin.top - tickSize,
                      ]}
                      stroke={theme.colors.plot.grid}
                      strokeWidth={1}
                      key={`time-submarker-${idx}-${i}`}
                    />
                  );
                })}
              </Group>
            );
          })}
        </Group>
      </Group>
      <Group name="timeline-labels" x={Constants.plot.margin.left}>
        {timeline.startTime === 0
          ? timeLabel(-firstHorizontalSubdivision)
          : null}
        {[...Array(horizontalSubdivisions + 3)].map((_, idx) =>
          timeLabel(idx * tickDuration),
        )}
      </Group>
      <Group name="value-labels" y={Constants.plot.margin.top}>
        {[...Array(Constants.plot.grid.verticalSubdivisions + 1)].map(
          (_, idx) => {
            return (
              <Text
                key={`value-label-${idx}`}
                y={
                  (plotSize.height / Constants.plot.grid.verticalSubdivisions) *
                    idx -
                  5
                }
                height={10}
                align="center"
                fontFamily={theme.fonts.body}
                fontSize={11}
                text={(
                  1 -
                  (1 / Constants.plot.grid.verticalSubdivisions) * idx
                ).toFixed(1)}
                fill={theme.colors.plot.grid}
                width={50}
              />
            );
          },
        )}
      </Group>
    </Layer>
  );
}

export default React.memo(Grid);
