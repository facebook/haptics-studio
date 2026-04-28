/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Konva from 'konva';
import {Circle, Group, Arc} from 'react-konva';
import {theme} from '../../../styles/theme.style';
import {PointType} from './EditablePoints';
import {Position} from '../../../state/types';
import Constants from '../../../globals/constants';

interface Props {
  point: Position;
  radius?: number;
  hoverRadius?: number;
  grabRadius?: number;
  opacity?: number;
  isSelected?: boolean;
  isDraggingVertically?: boolean;
  strokeColor: string;
  fillColor?: string;
  isInClosestPointsWindow?: boolean;
  isHovering?: boolean;
  onMouseDown?: (
    pointType: PointType,
    event: Konva.KonvaEventObject<MouseEvent>,
  ) => void;
  onMouseUp?: (event: Konva.KonvaEventObject<MouseEvent>) => void;
}

/**
 * Single draggable data point rendered in the Plot
 */
function DataPoint(props: Props) {
  const {
    point,
    radius = Constants.plot.point.radius,
    hoverRadius,
    grabRadius,
    opacity,
    isSelected,
    isDraggingVertically,
    strokeColor,
    fillColor,
    isInClosestPointsWindow,
    isHovering,
    onMouseDown,
    onMouseUp,
  } = props;

  return (
    <Group>
      {isSelected && isDraggingVertically ? (
        <Group>
          <Arc
            x={point.x}
            y={point.y}
            stroke={strokeColor}
            innerRadius={radius + 5}
            outerRadius={radius + 6}
            rotation={60}
            angle={60}
          />
          <Arc
            x={point.x}
            y={point.y}
            stroke={strokeColor}
            innerRadius={radius + 5}
            outerRadius={radius + 6}
            rotation={240}
            angle={60}
          />
        </Group>
      ) : null}
      {/* visual hover effect on the points when the mouse hit the affordance area  */}
      {isInClosestPointsWindow ? (
        <Group>
          <Circle
            x={point.x}
            y={point.y}
            radius={hoverRadius}
            fill={strokeColor}
            opacity={isHovering || isSelected ? 0.5 : 0}
          />
          <Circle
            transformsEnabled="position"
            perfectDrawEnabled={false}
            x={point.x}
            y={point.y}
            radius={radius}
            stroke={strokeColor}
            strokeWidth={isHovering || isSelected ? 2 : 1}
            fill={isSelected ? strokeColor : fillColor}
            opacity={opacity}
          />
          {/* Big underline circle that define the affordance for point selection */}
          <Circle
            x={point.x}
            y={point.y}
            radius={grabRadius}
            onMouseDown={e => onMouseDown?.(PointType.Data, e)}
            onMouseUp={e => onMouseUp?.(e)}
            fill={strokeColor}
            opacity={0}
          />
        </Group>
      ) : (
        <Circle
          transformsEnabled="position"
          perfectDrawEnabled={false}
          x={point.x}
          y={point.y}
          radius={radius}
          stroke={strokeColor}
          strokeWidth={isHovering || isSelected ? 2 : 1}
          onMouseDown={e => onMouseDown?.(PointType.Data, e)}
          onMouseUp={e => onMouseUp?.(e)}
          fill={isSelected ? strokeColor : fillColor}
          opacity={opacity}
        />
      )}
    </Group>
  );
}

DataPoint.defaultProps = {
  opacity: 1,
  isDraggingVertically: false,
  isHovering: false,
  isSelected: false,
  isInClosestPointsWindow: false,
  radius: Constants.plot.point.radius,
  hoverRadius: Constants.plot.point.hoverRadius,
  grabRadius: Constants.plot.point.grabRadius,
  fillColor: theme.colors.plot.background,
  onMouseDown: undefined,
  onMouseUp: undefined,
};

export default React.memo(DataPoint);
