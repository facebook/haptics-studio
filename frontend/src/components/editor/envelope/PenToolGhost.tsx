/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {Group, Line} from 'react-konva';
import DataPoint from './DataPoint';
import {timeToScreen} from '../../../globals/utils';
import {Position, RenderMetadata} from '../../../state/types';
import {MouseInfo} from './EditablePoints';

interface Props {
  renderMetadata: RenderMetadata;
  mouseInfo: MouseInfo;
  hasData: boolean;
  originPoint: Position;
  snapPoint: Position | undefined;
  strokeColor: string;
  clipContent?: boolean;
  isHoldingShift: boolean;
}

/**
 * The ghost of the new point when using the pen tool
 */
function PenToolGhost(props: Props) {
  const {
    renderMetadata,
    mouseInfo,
    hasData,
    snapPoint,
    originPoint,
    strokeColor,
    clipContent = true,
    isHoldingShift,
  } = props;
  const {adjacentPoints} = mouseInfo.hover;

  const left = adjacentPoints.left
    ? timeToScreen(adjacentPoints.left, renderMetadata)
    : undefined;
  const right = adjacentPoints.right
    ? timeToScreen(adjacentPoints.right, renderMetadata)
    : undefined;

  let horizontalPoint: Position | undefined;
  if (adjacentPoints.match) {
    if (!isHoldingShift) return null;
    horizontalPoint = timeToScreen(adjacentPoints.match, renderMetadata);
  }

  return (
    <Group
      listening={false}
      clipFunc={
        clipContent
          ? (ctx: any) => {
              // Clip the plot that can overflow in the gutters
              ctx.beginPath();
              ctx.rect(0, 0, renderMetadata.width, renderMetadata.height);
              ctx.closePath();
            }
          : undefined
      }>
      {/* Line connecting the last point with the ghost of the new point */}
      {left ? (
        <Line
          transformsEnabled="position"
          perfectDrawEnabled={false}
          listening={false}
          points={[
            left.x,
            left.y,
            horizontalPoint ? horizontalPoint.x : mouseInfo.position.x,
            snapPoint ? snapPoint.y : mouseInfo.position.y,
          ]}
          stroke={strokeColor}
          strokeWidth={1}
          visible={mouseInfo.position.x > 0 || hasData}
        />
      ) : null}
      {right ? (
        <Line
          transformsEnabled="position"
          perfectDrawEnabled={false}
          listening={false}
          points={[
            right.x,
            right.y,
            horizontalPoint ? horizontalPoint.x : mouseInfo.position.x,
            snapPoint ? snapPoint.y : mouseInfo.position.y,
          ]}
          stroke={strokeColor}
          strokeWidth={1}
          visible={mouseInfo.position.x > 0 || hasData}
        />
      ) : null}
      {horizontalPoint ? (
        <Group>
          <Line
            transformsEnabled="position"
            perfectDrawEnabled={false}
            listening={false}
            points={[
              horizontalPoint.x,
              mouseInfo.position.y,
              horizontalPoint.x,
              horizontalPoint.y,
            ]}
            stroke="#fff"
            strokeWidth={1}
            visible={mouseInfo.position.x > 0}
          />
        </Group>
      ) : null}

      {/* Dotted line for the snap point (when the new point is on the same level as a previous point) */}
      {snapPoint ? (
        <Line
          transformsEnabled="position"
          perfectDrawEnabled={false}
          listening={false}
          points={[snapPoint.x, snapPoint.y, mouseInfo.position.x, snapPoint.y]}
          stroke="#fff"
          strokeWidth={1}
        />
      ) : null}

      {/* Ghost for the new point */}
      {left || right ? (
        <DataPoint
          point={{
            x: horizontalPoint ? horizontalPoint.x : mouseInfo.position.x,
            y: snapPoint ? snapPoint.y : mouseInfo.position.y,
          }}
          strokeColor={strokeColor}
        />
      ) : null}

      {/* Ghost for the first data point only, constrained to the Y axis */}
      {!hasData && mouseInfo.position.x > 0 ? (
        <DataPoint point={{x: 0, y: originPoint.y}} strokeColor={strokeColor} />
      ) : null}
    </Group>
  );
}

PenToolGhost.defaultProps = {
  clipContent: false,
};

export default React.memo(PenToolGhost);
