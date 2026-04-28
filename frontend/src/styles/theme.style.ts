/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {createUseStyles, createTheming} from 'react-jss';
import {Classes, Styles} from 'jss';

const ThemeContext = React.createContext({});

// Creating a namespaced theming object.
const theming = createTheming(ThemeContext);

// Note that `useTheme` here comes from the `theming` object, NOT from `react-jss` import.
const {ThemeProvider, useTheme} = theming;

const shadows = {
  dialog:
    '0px 0px 32px 0px rgba(0, 0, 0, 0.10), 0px 16px 48px 0px rgba(0, 0, 0, 0.20), 1px 1px 1px 0px rgba(255, 255, 255, 0.10) inset, -1px -1px 1px 0px rgba(0, 0, 0, 0.10) inset',
  dialogAlt:
    '0px 0px 32px 0px rgba(0, 0, 0, 0.10), 0px 16px 48px 0px rgba(0, 0, 0, 0.20), 1px 1px 1px 0px rgba(255, 255, 255, 0.10) inset, -1px -1px 1px 0px rgba(0, 0, 0, 0.20) inset',
  input:
    '0px 1px 1px 0px rgba(255, 255, 255, 0.10), 0px 1px 1px 0px rgba(0, 0, 0, 0.10) inset',
  dropdown: '0px 2px 10px rgba(0,0,0,0.2)',
};

const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  xxl: '24px',
};

const typography = {
  caption: {
    fontSize: '10px',
    lineHeight: '12px',
    fontWeight: 400,
    letterSpacing: '0.2px',
  },
  small: {
    fontSize: '12px',
    lineHeight: '16px',
    fontWeight: 400,
    letterSpacing: '0.2px',
  },
  body: {
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: 400,
    letterSpacing: '0.2px',
  },
  bodyBold: {
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: 500,
    letterSpacing: '0.2px',
  },
  heading: {
    fontSize: '16px',
    lineHeight: '20px',
    fontWeight: 600,
    letterSpacing: '0.2px',
  },
  title: {
    fontSize: '18px',
    lineHeight: '24px',
    fontWeight: 500,
    letterSpacing: '0.2px',
  },
};

const fonts = {
  body: 'Inter, Helvetica, Arial, sans-serif',
  heading: 'Inter, Helvetica, Arial, sans-serif',
};

const colors = {
  accent: {
    red: '#F02849',
    blue: '#2D88FF',
    yellow: '#FCC12B',
    green: '#31A24C',
    red10: '#F028491A',
    blue20: '#2D88FF32',
    blue10: '#2D88FF1A',
    yellow10: '#FCC12B1A',
    green10: '#31A24C1A',
  },
  background: {
    light: '#414141',
    dark: '#272727',
    detail: 'rgba(255,255,255,0.5)',
    tag: 'rgba(255,255,255,0.1)',
    tagOpaque: '#303030',
    hover: 'rgba(255,255,255,0.05)',
    dialog: '#272727',
    body: 'rgba(255,255,255,0.05)',
    pressed: 'rgba(255,255,255,0.2)',
    primaryButton: 'rgba(255,255,255,0.9)',
    secondaryButton: '#FFFFFF1A',
    secondaryButtonHover: 'rgba(255,255,255,0.1)',
    exportPopover: '#323232',
  },
  navigator: {
    hover: 'rgba(255,255,255,0.05)',
    selected: 'rgba(255,255,255,0.1)',
  },
  switch: {
    backgroundOff: '#5D5D5D',
    backgroundOn: '#000000FF',
    handleOn: '#ffffff',
    handleOff: '#ffffff',
  },
  button: {
    primary: {
      main: '#fff',
      hover: '#fafafa',
      disabled: '#2D88FF33',
    },
    secondary: {
      main: '#FFFFFF1A',
      hover: '#FFFFFF33',
      disabled: '#FFFFFF1A',
    },
    borderless: {
      main: '#FFFFFF00',
      hover: '#FFFFFF1A',
      disabled: '#FFFFFF00',
    },
  },
  primary: {
    main: '#ffff',
    background: '#ffffff26',
    background10: '#ffffff0D',
  },
  text: {
    primary: '#E4E6EB',
    secondary: '#FFFFFF99',
    tag: 'rgba(255,255,255,0.9)',
    pressed: '#FFFFFF',
    selected: '#272727',
    dark: '#272727',
    sliderLabel: '#8e8e8e',
  },
  select: {
    accent: 'rgba(255,255,255,0.1)',
    background: '#3f4142',
    separator: 'rgba(0,0,0,0.3)',
  },
  contextMenu: {
    accent: 'rgba(255,255,255,0.1)',
    background: '#333333',
    separator: 'rgba(0,0,0,0.3)',
  },
  input: {
    background: '#2F3031',
    border: '#FFFFFF00',
    borderFocused: '#FFFFFF0D',
  },
  items: {
    separator: 'rgba(255,255,255,0.1)',
    current: '#418AF74D',
    selection: '#418AF74D',
  },
  tabs: {
    border: '#4D4D4D',
  },
  slider: {
    thumb: '#00000077',
  },
  plot: {
    grid: '#979797',
    background: '#272727',
    envelope: '#777777',
    axis: '#9c9c9c',
    amplitude: '#6178FD',
    amplitudeRgb: 'rgb(97, 120, 253)',
    amplitudeFill: '#4447EC',
    emphasis: '#A8BEFF',
    emphasisDark: '#B5E05877',
    frequency: '#FF66BF',
    frequencyFill: '#EA33EC',
    warning: '#FFBE00',
    hover: '#2a2a2a',
    popup: '#494d51',
    plotBackground: 'rgba(255,255,255,0.02)',
    brushHandle: '#c9c9c9ee',
    brushFill: '#FFFFFF26',
    frequencySelector: '#313131',
    frequencySelectorFill: 'rgba(255,255,255,0.1)',
    frequencySelectorStroke: 'rgba(255,255,255,0.1)',
    emphasisFrequencySelector: '#3E3F40',
    emphasisPointBackground: '#A8BEFF',
    emphasisLineBackground: '#A8BEFF28',
    trimDisabled: '#979797',
    trimEnabled: '#2D88FF',
    markerGutter: '#171717',
    markerActive: '#FFFFFF',
    clipPlayhead: '#3B82F6',
  },
  snackbar: {
    background: '#F2F2F2',
    backgroundDark: '#39393B',
  },
};

const sizes = {
  windowHeaderHeight: '50px',
  text: {
    side: '0.9rem',
  },
  borderRadius: {
    dialog: '14px',
    card: '4px',
    roundedCard: '8px',
    tooltip: '4px',
    toast: '8px',
    emphasisPoints: 2,
  },
};

export const theme = {
  colors,
  sizes,
  shadows,
  spacing,
  typography,
  fonts,
};

export type Theme = typeof theme;

export function createAppStyle<C extends string | number | symbol = string>(
  styles: Styles<C> | ((theme: Theme) => Styles<C>),
): (data?: unknown) => Classes<C> {
  return createUseStyles(styles, {theming: theming as any}) as (
    data?: unknown,
  ) => Record<C, string>;
}

export default {ThemeProvider, useTheme, theme, createAppStyle};
