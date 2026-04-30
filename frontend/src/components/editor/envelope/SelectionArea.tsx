/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {Layer, Rect} from 'react-konva';
import {SelectionRect} from '../../../state/types';
import {isSelectionRectValid} from '../../../globals/utils';

interface SelectionAreaProps {
  x: number;
  y: number;
  width: number;
  height: number;
  selection?: SelectionRect;
}

/**
 * Rectangle displaying the selection area dragged over the plot
 * @param props.y The offset position X
 * @param props.y The offset position Y
 * @param props.width The plot area width
 * @param props.height The plot area height
 * @param props.selection The selection rect
 */
function SelectionArea(props: SelectionAreaProps) {
  const {x, y, width, height, selection} = props;

  if (isSelectionRectValid(selection)) {
    const x0 = Math.min(selection?.x0 || 0, selection?.x1 || 0);
    const y0 = Math.min(selection?.y0 || 0, selection?.y1 || 0);
    let x1 = Math.max(selection?.x0 || 0, selection?.x1 || 0);
    let y1 = Math.max(selection?.y0 || 0, selection?.y1 || 0);

    if (x1 > width) x1 = width;
    if (y1 > height) y1 = height;

    return (
      <Layer name="selection-area">
        <Rect
          x={x0 + x}
          y={y0 + y}
          width={Math.abs(x1 - x0)}
          height={Math.abs(y1 - y0)}
          stroke="#ffffff99"
          strokeWidth={1}
          fill="#00000000"
          dash={[10, 10]}
        />
      </Layer>
    );
  }
  return null;
}

SelectionArea.defaultProps = {
  selection: {
    x0: undefined,
    x1: undefined,
    y0: undefined,
    y1: undefined,
  },
};

export default React.memo(SelectionArea);
