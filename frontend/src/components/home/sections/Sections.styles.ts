/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createAppStyle} from '../../../styles/theme.style';

export const useStyles = createAppStyle(theme => ({
  container: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.lg,
    '& h4': {
      ...theme.typography.heading,
      fontWeight: 400,
      marginBottom: '0px',
      marginTop: theme.spacing.lg,
    },
  },
  header: {
    marginTop: theme.spacing.lg,
    display: 'flex',
    justifyContent: 'space-between',
  },
  list: {
    width: '100%',
    display: 'grid',
    gridAutoRows: '1fr',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: theme.spacing.lg,
    rowGap: theme.spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    '&.two': {
      gridTemplateColumns: '1fr 1fr',
    },
  },
  item: {
    flex: 1,
    minHeight: '60px',
    color: theme.colors.text.secondary,
    borderRadius: theme.sizes.borderRadius.roundedCard,
    background: theme.colors.background.body,
    width: '100%',
    padding: theme.spacing.xl,
    transition: 'all .1s',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    '& img': {
      height: 28,
      width: 28,
      marginRight: theme.spacing.sm,
      objectFit: 'cover',
    },
    '&:hover': {
      background: theme.colors.background.secondaryButtonHover,
      color: theme.colors.text.primary,
    },
  },
  itemContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    '& .name': {
      marginBottom: theme.spacing.sm,
      ...theme.typography.heading,
      color: theme.colors.text.primary,
      display: 'flex',
      gap: '6px',
      position: 'relative',
    },
    '& .new': {
      display: 'inline-block',
      position: 'relative',
      top: '-6px',
      color: theme.colors.button.primary.main,
      textTransform: 'uppercase',
      ...theme.typography.caption,
      fontWeight: 100,
    },
    '& .tag': {
      whiteSpace: 'nowrap',
      width: 'min-content',
      ...theme.typography.small,
      color: theme.colors.text.tag,
      background: theme.colors.background.tag,
      padding: '3px 6px',
      borderRadius: theme.sizes.borderRadius.card,
    },
  },
  chevron: {
    width: '24px',
    height: '24px',
    transition: 'all .2s',
  },
}));
