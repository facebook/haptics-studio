/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createAppStyle} from '../../styles/theme.style';
import {
  overlayCentered,
  dialogPanel,
  dialogHeader,
  dialogClose,
  dialogTitle,
} from '../../styles/shared.styles';
export {ZIndex} from '../../styles/zIndex';

export const useStyles = createAppStyle(theme => ({
  background: {
    ...overlayCentered,
    color: theme.colors.text.pressed,
    padding: '10px',
    boxShadow: '0px 2px 8px rgba(0,0,0,0.15)',
  },
  dialog: {
    ...dialogPanel(theme),
    width: '800px',
    '&.small': {
      width: '500px',
    },
    '&.medium': {
      width: '680px',
    },
    '&.large': {
      width: '1024px',
    },
  },
  header: {
    ...dialogHeader(theme),
  },
  close: {
    ...dialogClose,
  },
  title: {
    ...dialogTitle(theme),
  },
}));
