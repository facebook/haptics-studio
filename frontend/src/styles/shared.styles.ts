/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Theme} from './theme.style';

// -- Overlay styles --

export const overlayBase = {
  position: 'fixed' as const,
  bottom: 0,
  left: 0,
  right: 0,
  top: 0,
};

export const overlayDark = {
  ...overlayBase,
  background: '#0009',
};

export const overlayCentered = {
  ...overlayDark,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

// -- Dialog anatomy --

export const dialogPanel = (theme: Theme) => ({
  display: 'flex',
  alignItems: 'baseline',
  flexDirection: 'column' as const,
  gap: theme.spacing.lg,
  fontSize: '0.875rem',
  backgroundColor: theme.colors.background.dialog,
  color: theme.colors.text.secondary,
  borderRadius: theme.sizes.borderRadius.dialog,
  boxShadow: theme.shadows.dialog,
});

export const dialogHeader = (theme: Theme) => ({
  width: '100%',
  height: '50px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative' as const,
  borderBottom: `1px solid ${theme.colors.items.separator}`,
});

export const dialogTitle = (theme: Theme) => ({
  color: theme.colors.text.primary,
  ...theme.typography.heading,
  margin: 0,
});

export const dialogClose = {
  position: 'absolute' as const,
  top: '10px',
  right: '10px',
};

export const dialogActions = (theme: Theme) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: '100%',
  gap: theme.spacing.sm,
  padding: `${theme.spacing.sm} ${theme.spacing.md} ${theme.spacing.lg}`,
});

// -- Menu styles --

export const menuBase = (theme: Theme) => ({
  position: 'absolute' as const,
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'center',
  minWidth: '200px',
  borderRadius: theme.sizes.borderRadius.card,
  boxShadow: theme.shadows.dropdown,
  ...theme.typography.body,
  padding: theme.spacing.sm,
});

export const menuSeparator = (theme: Theme) => ({
  margin: `${theme.spacing.sm} 0`,
  height: '1px',
  width: '100%',
});

// -- Section header --

export const sectionHeader = (theme: Theme) => ({
  fontWeight: 400,
  margin: '8px 0px 12px',
  fontSize: '11px',
  lineHeight: '16px',
  textTransform: 'uppercase' as const,
  color: theme.colors.text.secondary,
});

// -- Slider controls --

export const sliderContainer = {
  display: 'flex',
  alignItems: 'center',
};

export const sliderThumb = (theme: Theme) => ({
  height: '12px',
  width: '12px',
  borderRadius: '50%',
  backgroundColor: theme.colors.slider.thumb,
});
