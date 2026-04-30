/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Konva from 'konva';
import React from 'react';
import {Stage, Layer, Rect, Shape, Group, Line} from 'react-konva';

import Constants from '../../../globals/constants';
import {theme} from '../../../styles/theme.style';
import {EditorPointData, EnvelopeType, RenderSize} from '../../../state/types';
import {polygonData, timeToScreen} from '../../../globals/utils';

interface TimelinePlotProps {
  renderSize: RenderSize;
  envelope: Array<EditorPointData>;
  amplitude: Array<EditorPointData>;
  frequency: Array<EditorPointData>;
  duration: number;
  selected: EnvelopeType;
  audioPlayhead?: number;
}

/**
 * Static timeline that renders the whole file. The component is momized to avoid unwanted re-renders
 */
function TimelinePlot(props: TimelinePlotProps) {
  const {
    renderSize,
    envelope,
    amplitude,
    frequency,
    duration,
    selected,
    audioPlayhead,
  } = props;

  if (renderSize.width === 0) {
    return null;
  }

  const renderMetadata = {
    width: renderSize.width - renderSize.margin.left - renderSize.margin.right,
    height:
      renderSize.height - renderSize.margin.top - renderSize.margin.bottom,
    duration,
    startTime: 0,
    margin: renderSize.margin,
  };
  const audioPlayheadX = audioPlayhead
    ? timeToScreen({x: audioPlayhead, y: 0}, renderMetadata).x
    : 0;

  const envelopeShapes = (data: EditorPointData[], type: EnvelopeType) => {
    const strokeColor =
      type === EnvelopeType.Amplitude
        ? theme.colors.plot.amplitude
        : theme.colors.plot.frequency;
    const fillColor =
      type === EnvelopeType.Amplitude
        ? theme.colors.plot.amplitudeFill
        : theme.colors.plot.frequencyFill;
    return (
      <Group>
        <Shape
          transformsEnabled="position"
          perfectDrawEnabled={false}
          sceneFunc={(context, shape) =>
            polygonData(context, shape, data, renderMetadata, true)
          }
          fillLinearGradientStartPoint={{x: 0, y: 0}}
          fillLinearGradientEndPoint={{x: 0, y: renderMetadata.height}}
          fillLinearGradientColorStops={[0, fillColor, 1, `${fillColor}33`]}
          opacity={selected === type ? 1 : 0.3}
        />
        <Shape
          transformsEnabled="position"
          perfectDrawEnabled={false}
          sceneFunc={(context, shape) =>
            polygonData(context, shape, data, renderMetadata, false)
          }
          stroke={strokeColor}
          strokeWidth={1}
          opacity={selected === type ? 1 : 0.3}
        />
      </Group>
    );
  };

  return (
    <Stage
      x={renderSize.margin.left}
      y={renderSize.margin.top}
      width={renderSize.width}
      height={renderSize.height}>
      <Layer
        listening={false}
        clipFunc={(ctx: Konva.Context) => {
          // Clip the time ticks that can overflow in the gutters
          ctx.beginPath();
          ctx.roundRect(
            0,
            0,
            renderMetadata.width,
            renderMetadata.height,
            Constants.timeline.borderRadius,
          );
          ctx.closePath();
        }}>
        <Rect
          x={0}
          y={0}
          width={renderMetadata.width}
          height={renderMetadata.height}
          cornerRadius={Constants.timeline.borderRadius}
          fill={theme.colors.plot.plotBackground}
        />
        {/* Envelope's polygon */}
        {envelope.length > 1 && duration > 0 ? (
          <Shape
            transformsEnabled="position"
            perfectDrawEnabled={false}
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
          />
        ) : null}

        {/* Amplitude's polygon */}
        {amplitude.length > 1 && duration > 0
          ? envelopeShapes(amplitude, EnvelopeType.Amplitude)
          : null}

        {/* Frequency's polygon */}
        {frequency.length > 1 && duration > 0
          ? envelopeShapes(frequency, EnvelopeType.Frequency)
          : null}
        {props.audioPlayhead !== undefined ? (
          <Line
            x={audioPlayheadX}
            y={0}
            points={[0, 0, 0, renderMetadata.height]}
            stroke="#fff"
            strokeWidth={2}
          />
        ) : null}
      </Layer>
    </Stage>
  );
}

TimelinePlot.defaultProps = {
  audioPlayhead: undefined,
};

export default React.memo(TimelinePlot);
