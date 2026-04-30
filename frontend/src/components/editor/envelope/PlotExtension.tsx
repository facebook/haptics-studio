/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {Group, Line} from 'react-konva';
import {Html} from 'react-konva-utils';

import {EnvelopeType, Rectangle, RenderMetadata} from '../../../state/types';
import {createAppStyle, theme} from '../../../styles/theme.style';

const useStyles = createAppStyle({
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    position: 'absolute',
  },
  label: {
    fontSize: '12px',
    textAlign: 'center',
    padding: '4px',
    lineHeight: '12px',
  },
});

interface Props {
  extensionText?: string;
  isSelected: boolean;
  rect: Rectangle;
  renderMetadata: RenderMetadata;
  type: EnvelopeType;
}

const LabelWidth = 310;

/**
 * Automatic envelope extension when one of the envelops is longer than the other
 */
function PlotExtension(props: Props) {
  const {extensionText, isSelected, rect, renderMetadata, type} = props;

  const classes = useStyles();
  const [showGuidance, setShowGuidance] = React.useState(false);

  let {width} = rect;
  const strokeColor =
    type === EnvelopeType.Amplitude
      ? theme.colors.plot.amplitude
      : theme.colors.plot.frequency;
  const fillColor =
    type === EnvelopeType.Amplitude
      ? theme.colors.plot.amplitudeFill
      : theme.colors.plot.frequencyFill;

  if (rect.x + rect.width > renderMetadata.width) {
    width = renderMetadata.width - rect.x;
  }

  let translateX = 0;
  if (rect.x + width / 2 + LabelWidth / 2 - renderMetadata.width > 0) {
    translateX = rect.x + width / 2 + LabelWidth / 2 - renderMetadata.width;
  } else if (rect.x + width / 2 - LabelWidth / 2 < 0) {
    translateX = rect.x + width / 2 - LabelWidth / 2;
  }

  if (Math.ceil(rect.x) >= renderMetadata.width) {
    return null;
  }

  return width > 0 && rect.height > 0 ? (
    <Group>
      <Line
        points={[rect.x, rect.y, rect.x + rect.width, rect.y]}
        stroke={strokeColor}
        strokeWidth={1}
      />
      <Line
        points={[
          rect.x,
          rect.y,
          rect.x + rect.width,
          rect.y,
          rect.x + rect.width,
          rect.y + rect.height,
          rect.x,
          rect.y + rect.height,
        ]}
        closed
        fillLinearGradientStartPoint={{x: 0, y: 0}}
        fillLinearGradientEndPoint={{x: 0, y: renderMetadata.height}}
        fillLinearGradientColorStops={[0, fillColor, 1, `${fillColor}33`]}
      />
      <Html>
        <div
          className={classes.container}
          style={{
            left: `${rect.x + 10}px`,
            top: `${rect.y + 10}px`,
            width: `${width - 20}px`,
            height: `${rect.height - 20}px`,
          }}
          onMouseEnter={() => setShowGuidance(true)}
          onMouseLeave={() => setShowGuidance(false)}>
          {isSelected && showGuidance ? (
            <span
              className={classes.label}
              style={{
                width: `${LabelWidth}px`,
                color: strokeColor,
                transform: `translateX(${-translateX}px)`,
              }}>
              {extensionText}
            </span>
          ) : null}
        </div>
      </Html>
    </Group>
  ) : null;
}

PlotExtension.defaultProps = {
  extensionText: '',
};

export default React.memo(PlotExtension);
