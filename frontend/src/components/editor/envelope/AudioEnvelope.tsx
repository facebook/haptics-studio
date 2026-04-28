/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Konva from 'konva';
import {Stage, Layer, Group, Shape} from 'react-konva';
import Constants from '../../../globals/constants';
import {theme} from '../../../styles/theme.style';
import {polygonData} from '../../../globals/utils';
import {EditorPointData, TimeLineState} from '../../../state/types';
import {useRenderMetadata} from '../../../hooks/useRenderMetadata';

interface Props {
  width: number;
  height: number;
  envelope: Array<EditorPointData>;
  timeline: TimeLineState;
}

/**
 * Renders the Audio Envelope static polygon and the base grid
 */
function AudioEnvelope(props: Props): JSX.Element | null {
  const {width, height, envelope, timeline} = props;

  const renderMetadata = useRenderMetadata(width, height, timeline);

  if (width === 0) {
    return null;
  }

  return (
    <Stage
      x={Constants.plot.margin.left}
      y={Constants.plot.margin.top}
      width={width}
      height={height}>
      <Layer>
        <Group
          listening={false}
          clipFunc={(ctx: Konva.Context) => {
            ctx.beginPath();
            ctx.rect(0, 0, renderMetadata.width, renderMetadata.height);
            ctx.closePath();
          }}>
          {/* Envelope's polygon */}
          {envelope.length > 0 ? (
            <Shape
              transformsEnabled="position"
              closed
              sceneFunc={(context, shape) =>
                polygonData(context, shape, envelope, renderMetadata, true)
              }
              fillLinearGradientStartPoint={{x: 0, y: 0}}
              fillLinearGradientEndPoint={{x: 0, y: renderMetadata.height}}
              fillLinearGradientColorStops={[
                0,
                theme.colors.plot.envelope,
                1,
                `${theme.colors.plot.envelope}33`,
              ]}
              strokeWidth={1}
            />
          ) : null}
        </Group>
      </Layer>
    </Stage>
  );
}

export default React.memo(AudioEnvelope);
