/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {ReactSliderProps} from 'react-slider';
import {theme} from '../../styles/theme.style';

/**
 * Creates a renderTrack function for ReactSlider.
 * @param color The active track color
 * @param activeIndex The track segment index that should use the active color (0 for single sliders, 1 for range sliders)
 */
export function createRenderTrack(
  color: string,
  activeIndex: number = 0,
): NonNullable<ReactSliderProps['renderTrack']> {
  return (p, s) => {
    const props = p as React.HTMLAttributes<HTMLDivElement> & {
      style: React.CSSProperties;
    };
    const {style} = props;
    return (
      <div
        {...props}
        style={{
          position: 'absolute',
          left: style.left,
          right: style.right,
          backgroundColor:
            s.index === activeIndex ? color : 'rgba(255,255,255,0.1)',
          height: '12px',
          borderRadius: '6px',
          boxShadow: s.index === 0 ? theme.shadows.input : 'none',
        }}
      />
    );
  };
}

/**
 * Creates a renderThumb function for ReactSlider.
 * @param color The thumb border color
 */
export function createRenderThumb(
  color: string,
): NonNullable<ReactSliderProps['renderThumb']> {
  return p => {
    const props = p as React.HTMLAttributes<HTMLDivElement> & {
      style: React.CSSProperties;
    };
    const {style} = props;
    return (
      <div
        {...props}
        style={{
          ...style,
          backgroundColor: theme.colors.slider.thumb,
          borderColor: color,
          borderStyle: 'solid',
          borderWidth: '2px',
        }}
      />
    );
  };
}
