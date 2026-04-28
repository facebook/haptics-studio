/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Konva from 'konva';
import {Group, Line, Path, Rect} from 'react-konva';

import {EmphasisType, Position} from '../../../state/types';
import Constants from '../../../globals/constants';
import {theme} from '../../../styles/theme.style';
import {PointType} from './EditablePoints';
import {emphasisTypeFrom} from '../../../globals/utils';
import DataPoint from './DataPoint';

export function EmphasisIcon(props: {
  type: EmphasisType;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}): JSX.Element {
  const path = React.useMemo(() => {
    switch (props.type) {
      case EmphasisType.Round:
        return 'M1 7C1 7 1 3 5 3C9 3 9 7 9 7';
      case EmphasisType.Medium:
        return 'M1 7L5 3L9 7';
      case EmphasisType.Sharp:
        return 'M1 7C3.66667 7 5 3 5 3C5 3 6.33333 7 9 7';
      default:
        return '';
    }
  }, [props.type]);

  return (
    <Path
      listening={false}
      scale={{x: props.width / 10, y: props.height / 10}}
      x={props.x}
      y={props.y}
      data={path}
      width={10}
      height={10}
      stroke={props.color}
      strokeWidth={1.5}
    />
  );
}

interface Props {
  amplitude: Position;
  emphasis: number;
  frequency: number;
  containerHeight: number;
  isHoldingShift?: boolean;
  isHovering?: boolean;
  isInClosestPointsWindow?: boolean;
  isSelected?: boolean;
  readOnly?: boolean;
  onMouseDown?: (
    type: PointType,
    e: Konva.KonvaEventObject<MouseEvent>,
  ) => void;
  onMouseUp?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
}

function EmphasisIndicator(props: Props) {
  const {
    amplitude,
    emphasis,
    frequency,
    containerHeight,
    isHoldingShift = false,
    isHovering = false,
    isInClosestPointsWindow = false,
    isSelected = false,
    readOnly = false,
    onMouseDown,
    onMouseUp,
  } = props;

  return (
    <Group name="emphasis">
      <Line
        points={[amplitude.x, emphasis, amplitude.x, containerHeight]}
        stroke={isSelected ? '#A8BEFFBF' : '#87A2FC'}
        strokeWidth={Constants.plot.point.radius * 2}
        opacity={isSelected ? 1 : 0.4}
        onMouseDown={e => onMouseDown?.(PointType.EmphasisBody, e)}
      />
      {!readOnly ? (
        <Group>
          <DataPoint
            point={amplitude}
            strokeColor={isSelected ? theme.colors.plot.amplitude : 'white'}
            isDraggingVertically={isHoldingShift}
            isHovering={isHovering}
            isInClosestPointsWindow={isInClosestPointsWindow}
            isSelected={isSelected}
            fillColor={isSelected ? theme.colors.plot.amplitude : 'white'}
            onMouseDown={(type, e) => onMouseDown?.(type, e)}
            onMouseUp={e => onMouseUp?.(e)}
          />
          <Rect
            name="amplitude-intensity-handle"
            x={amplitude.x - Constants.plot.emphasis.mouseTargetWidth / 2}
            y={emphasis - Constants.plot.emphasis.mouseTargetWidth / 2}
            height={Constants.plot.emphasis.mouseTargetWidth}
            width={Constants.plot.emphasis.mouseTargetWidth}
            fill="transparent"
            onMouseDown={e => onMouseDown?.(PointType.Emphasis, e)}
            onMouseUp={e => onMouseUp?.(e)}
          />
        </Group>
      ) : null}
      <Rect
        name="amplitude-intensity"
        x={amplitude.x - Constants.plot.emphasis.width / 2}
        y={emphasis - Constants.plot.emphasis.width / 2}
        height={Constants.plot.emphasis.width}
        width={Constants.plot.emphasis.width}
        fill={theme.colors.plot.emphasisPointBackground}
        cornerRadius={theme.sizes.borderRadius.emphasisPoints}
        listening={false}
      />
      <EmphasisIcon
        type={emphasisTypeFrom(frequency)}
        x={amplitude.x - Constants.plot.emphasis.width / 2}
        y={emphasis - Constants.plot.emphasis.width / 2}
        width={Constants.plot.emphasis.iconWidth}
        height={Constants.plot.emphasis.iconWidth}
        color={theme.colors.plot.amplitude}
      />
    </Group>
  );
}

EmphasisIndicator.defaultProps = {
  isHoldingShift: false,
  isHovering: false,
  isInClosestPointsWindow: false,
  isSelected: false,
  readOnly: false,
  onMouseDown: undefined,
  onMouseUp: undefined,
};

export default React.memo(EmphasisIndicator);
