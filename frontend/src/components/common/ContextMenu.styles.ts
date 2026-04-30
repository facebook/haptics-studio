/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createAppStyle} from '../../styles/theme.style';
import {ZIndex} from '../../styles/zIndex';
import {overlayBase, menuBase, menuSeparator} from '../../styles/shared.styles';

export const useStyles = createAppStyle(theme => ({
  background: {
    ...overlayBase,
    background: '#0000',
    zIndex: ZIndex.Menu,
  },
  menu: {
    ...menuBase(theme),
    width: '200px',
    background: theme.colors.contextMenu.background,
    '& span': {
      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
      display: 'flex',
      ...theme.typography.bodyBold,
      borderRadius: theme.sizes.borderRadius.card,
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing.sm,
      color: theme.colors.text.primary,
      '&:hover': {
        background: theme.colors.contextMenu.accent,
        color: theme.colors.text.pressed,
      },
      '&.left': {
        justifyContent: 'start',
        '& aside': {
          marginLeft: 'auto',
          opacity: 0.3,
        },
      },
    },
  },
  disabled: {
    opacity: 0.4,
    pointerEvents: 'none',
  },
  separator: {
    ...menuSeparator(theme),
    backgroundColor: theme.colors.contextMenu.separator,
  },
}));
