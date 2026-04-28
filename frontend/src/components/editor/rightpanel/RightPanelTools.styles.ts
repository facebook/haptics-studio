/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createAppStyle} from '../../../styles/theme.style';
import {
  sectionHeader,
  sliderContainer as sliderContainerBase,
  sliderThumb,
} from '../../../styles/shared.styles';

export const useStyles = createAppStyle(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    padding: '4px 12px',
    '&::after': {
      content: '""',
      height: '2px',
      boxShadow: theme.shadows.dialog,
    },
    '&:last-of-type::after': {
      height: '0',
    },
  },
  block: {
    display: 'flex',
    flexDirection: 'column',
    borderRadius: theme.sizes.borderRadius.card,
  },
  title: {
    ...sectionHeader(theme),
    display: 'flex',
    justifyContent: 'space-between',
    '&.centered': {
      margin: '8px 0px',
    },
  },
  label: {
    color: theme.colors.text.primary,
    ...theme.typography.bodyBold,
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '9px 0px',
    gap: theme.spacing.sm,
  },
  sectionContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    '& > section': {
      minWidth: 0,
      flex: 1,
      flexShrink: 1,
      display: 'flex',
      flexDirection: 'column',
    },
  },
  inputContainer: {
    position: 'relative',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    '& input': {
      minWidth: 0,
      maxWidth: '100%',
      width: '100%',
      background: theme.colors.background.body,
      borderRadius: theme.sizes.borderRadius.card,
      border: `1px solid ${theme.colors.input.border}`,
      color: theme.colors.text.secondary,
      boxShadow:
        '0px 1px 1px 0px rgba(255, 255, 255, 0.10), 0px 1px 1px 0px rgba(0, 0, 0, 0.10) inset',
      padding: '0px 28px 0px 8px',
      height: '32px',
      transition: 'all .2s',
      '& + *': {
        opacity: 0.5,
        transition: 'all .2s',
      },
      '&:hover, &:focus': {
        border: `1px solid ${theme.colors.input.borderFocused}`,
        color: theme.colors.text.primary,
        '& + *': {
          opacity: 1,
        },
      },
      '&:read-only': {
        border: `1px solid ${theme.colors.input.border}`,
        background: theme.colors.background.body,
        color: theme.colors.text.secondary,
        opacity: 0.8,
      },
    },
  },
  stepper: {
    position: 'absolute',
    right: '4px',
    top: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    '& img': {
      width: '20px',
      height: '16px',
      objectFit: 'cover',
    },
  },
  sliderContainer: {
    ...sliderContainerBase,
  },
  slider: {
    display: 'flex',
    flex: '1',
    alignItems: 'center',
    margin: '8px 0px 16px',
  },
  thumb: {
    ...sliderThumb(theme),
  },
  stepLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingBottom: theme.spacing.sm,
    '& img': {
      margin: '4px 0',
    },
  },
  penTool: {
    '&.amplitude': {
      backgroundColor: theme.colors.plot.amplitude,
    },
    '&.frequency': {
      backgroundColor: theme.colors.plot.frequency,
    },
  },
  guidance: {
    marginBottom: theme.spacing.sm,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.colors.background.body,
    borderLeftWidth: '5px',
    borderLeftStyle: 'solid',
    borderRadius: theme.sizes.borderRadius.card,
    fontSize: '12px',
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    color: theme.colors.text.secondary,
    gap: '2px',
    '& h1': {
      color: theme.colors.text.primary,
      margin: 0,
      ...theme.typography.body,
      fontWeight: 700,
    },
    '&.amplitude': {
      borderColor: theme.colors.plot.amplitude,
    },
    '&.frequency': {
      borderColor: theme.colors.plot.frequency,
    },
  },
  trimButton: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    height: '32px',
    '& img': {
      width: '14px',
    },
  },
  audio: {
    display: 'flex',
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    gap: theme.spacing.sm,
    '& section': {
      display: 'flex',
      flexDirection: 'column',
      fontSize: '12px',
      fontWeight: 400,
    },
  },
  tag: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    fontFamily: theme.fonts.body,
    border: 'none',
    textAlign: 'center',
    background: theme.colors.button.secondary.main,
    borderRadius: theme.sizes.borderRadius.card,
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    color: theme.colors.text.pressed,
    ...theme.typography.small,
    fontWeight: 600,
  },
}));
