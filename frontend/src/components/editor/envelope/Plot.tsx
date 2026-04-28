/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {Group, Shape} from 'react-konva';

import {theme} from '../../../styles/theme.style';
import {polygonData, timeToScreen} from '../../../globals/utils';
import {
  EditorPointData,
  EnvelopeType,
  Rectangle,
  TimeLineState,
} from '../../../state/types';
import {useRenderMetadata} from '../../../hooks/useRenderMetadata';
import PlotExtension from './PlotExtension';
import EmphasisIndicator from './EmphasisIndicator';

interface Props {
  width: number;
  height: number;
  data: Array<EditorPointData>;
  timeline: TimeLineState;
  maxEnvelopeDuration?: number;
  extensionText?: string;
  type: EnvelopeType;
  isSelected?: boolean;
  offset?: number;
  opacity?: number;
}

/**
 * Renders the lines connecting the data points
 */
function Plot(props: Props) {
  const {
    width,
    height,
    data,
    timeline,
    maxEnvelopeDuration = 0,
    extensionText = '',
    type,
    isSelected = false,
    offset = 0,
    opacity = 1,
  } = props;

  const renderMetadata = useRenderMetadata(width, height, timeline);

  const strokeColor =
    type === EnvelopeType.Amplitude
      ? theme.colors.plot.amplitude
      : theme.colors.plot.frequency;
  const fillColor =
    type === EnvelopeType.Amplitude
      ? theme.colors.plot.amplitudeFill
      : theme.colors.plot.frequencyFill;
  const emphasisData = React.useMemo(
    () => data.filter(d => d && d.emphasis),
    [data],
  );

  if (width === 0) {
    return null;
  }

  let plotExtension: Rectangle | undefined;
  if (data.length > 0 && data[data.length - 1].x < maxEnvelopeDuration) {
    if (
      data[data.length - 1].x <= timeline.endTime &&
      maxEnvelopeDuration >= timeline.startTime
    ) {
      const start = timeToScreen(data[data.length - 1], renderMetadata);
      const end = timeToScreen({x: maxEnvelopeDuration, y: 0}, renderMetadata);
      const x = start.x >= 0 ? start.x : 0;
      plotExtension = {
        x,
        y: renderMetadata.height - (end.y - start.y),
        width: Math.min(end.x - x, renderMetadata.width - x),
        height: end.y - start.y,
      };
    }
  }

  return (
    <Group
      opacity={opacity}
      clipFunc={(ctx: any) => {
        // Clip the plot that can overflow in the gutters
        ctx.beginPath();
        ctx.rect(0, 0, renderMetadata.width, renderMetadata.height);
        ctx.closePath();
      }}>
      {/* Audio Envelope polygon */}
      {data.length > 0 ? (
        <Group>
          <Shape
            transformsEnabled="position"
            perfectDrawEnabled={false}
            listening={false}
            sceneFunc={(context, shape) =>
              polygonData(context, shape, data, renderMetadata, true, {
                x: offset,
                y: 0,
                index: 0,
              })
            }
            fillLinearGradientStartPoint={{x: 0, y: 0}}
            fillLinearGradientEndPoint={{x: 0, y: renderMetadata.height}}
            fillLinearGradientColorStops={[0, fillColor, 1, `${fillColor}33`]}
          />
          <Shape
            transformsEnabled="position"
            perfectDrawEnabled={false}
            listening={false}
            sceneFunc={(context, shape) =>
              polygonData(context, shape, data, renderMetadata, false, {
                x: offset,
                y: 0,
                index: 0,
              })
            }
            stroke={strokeColor}
            strokeWidth={1}
          />
        </Group>
      ) : null}
      {plotExtension ? (
        <PlotExtension
          rect={plotExtension}
          extensionText={extensionText}
          type={type}
          isSelected={isSelected}
          renderMetadata={renderMetadata}
        />
      ) : null}
      {emphasisData.map(p => {
        const amplitude = timeToScreen(p, renderMetadata);
        const point = timeToScreen(
          {x: p.x, y: p.emphasis?.y ?? 0},
          renderMetadata,
        );
        return (
          <EmphasisIndicator
            key={`emphasis-${p.index}`}
            amplitude={amplitude}
            emphasis={point.y}
            frequency={p.emphasis?.frequency ?? 0}
            containerHeight={renderMetadata.height}
            readOnly
          />
        );
      })}
    </Group>
  );
}

Plot.defaultProps = {
  maxEnvelopeDuration: 0,
  extensionText: undefined,
  isSelected: false,
  offset: 0,
  opacity: 1,
};

export default React.memo(Plot);
