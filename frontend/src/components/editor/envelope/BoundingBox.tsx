/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {Group, Rect} from 'react-konva';

import {createAppStyle} from '../../../styles/theme.style';
import {BoundingBoxPadding} from '../../../globals/constants';
import HoverCursor from '../../common/HoverCursor';
import {PointType} from './EditablePoints';
import {BoundingRect} from '../../../state/types';

const useStyles = createAppStyle({
  container: {
    cursor: 'move',
  },
});

interface BoundingBoxProps {
  selection: BoundingRect;
  onMouseDown: (pointType: PointType) => void;
}

/**
 * Rectangle displaying the bounding box around the selection
 * @param {IPosition[]} props.selection The selected points
 */
function BoundingBox(props: BoundingBoxProps) {
  const {selection, onMouseDown} = props;

  const classes = useStyles();

  const width = Math.abs(selection.x1 - selection.x0);
  const height = Math.abs(selection.y1 - selection.y0);
  const handleWidth = Math.min(width - BoundingBoxPadding * 2, 40);
  const handlePadding = 4;

  return (
    <Group>
      <HoverCursor type="move">
        <Rect
          className={classes.container}
          x={selection.x0}
          y={selection.y0}
          width={Math.abs(selection.x1 - selection.x0)}
          height={Math.abs(selection.y1 - selection.y0)}
          stroke="#ffffff"
          strokeWidth={1}
          fill="#00000000"
          dash={[10, 10]}
          onMouseDown={onMouseDown.bind(null, PointType.Data)}
        />
      </HoverCursor>
      <HoverCursor type="row-resize">
        <Rect
          x={selection.x0 + width / 2 - handleWidth / 2}
          y={selection.y0 - 2}
          width={handleWidth}
          height={4}
          cornerRadius={4}
          fill="#fff"
        />
        <Rect
          x={selection.x0 + width / 2 - handleWidth / 2 - handlePadding}
          y={selection.y0 - 2 - handlePadding / 2}
          width={handleWidth + handlePadding * 2}
          height={4 + handlePadding}
          onMouseDown={onMouseDown.bind(null, PointType.ScaleAnchorDown)}
        />
      </HoverCursor>
      <HoverCursor type="row-resize">
        <Rect
          x={selection.x0 + width / 2 - handleWidth / 2}
          y={selection.y0 + height - 2}
          width={handleWidth}
          height={4}
          cornerRadius={4}
          fill="#fff"
        />
        <Rect
          x={selection.x0 + width / 2 - handleWidth / 2 - handlePadding}
          y={selection.y0 + height - 2 - handlePadding}
          width={handleWidth + handlePadding * 2}
          height={4 + handlePadding * 2}
          onMouseDown={onMouseDown.bind(null, PointType.ScaleAnchorUp)}
        />
      </HoverCursor>
    </Group>
  );
}

export default React.memo(BoundingBox);
