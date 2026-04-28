/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createAppStyle} from '../../../styles/theme.style';

export const HeaderHeight = 30;
export const ClipHeight = 30;

export const useStyles = createAppStyle(theme => ({
  container: {
    paddingRight: '5px',
    width: '100%',
    height: `calc(calc(100vh - ${theme.sizes.windowHeaderHeight}) - 16px)`,
    position: 'relative',
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    fontSize: '0.75rem',
    background: theme.colors.background.dark,
    borderRight: `1px solid ${theme.colors.background.light}`,
  },
  navigatorHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '50px',
    gap: '2px',
    borderBottom: `1px solid ${theme.colors.background.dark}`,
    padding: `0px ${theme.spacing.sm} 0px ${theme.spacing.xl}`,
    position: 'relative',
    '& span': {
      ...theme.typography.body,
      fontWeight: 600,
      color: theme.colors.text.primary,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '& input': {
      color: theme.colors.text.primary,
      padding: '0 2px',
      width: '100%',
      boxSizing: 'border-box',
      border: `1px solid ${theme.colors.accent.blue}`,
      background: 'transparent',
      borderRadius: theme.sizes.borderRadius.card,
      fontFamily: 'inherit',
      ...theme.typography.body,
      fontWeight: 500,
      resize: 'none',
      transition: 'all .1s',
    },
  },
  clips: {
    flex: 1,
    padding: `${theme.spacing.xs} ${theme.spacing.sm} ${theme.spacing.xs} ${theme.spacing.xs}`,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    overflowX: 'hidden',
    position: 'relative',
    transition: 'all .5s',
    '&.empty': {
      borderRadius: theme.sizes.borderRadius.card,
      margin: theme.spacing.sm,
    },
    '&.empty.drag-over-accept': {
      background: theme.colors.primary.background,
    },
    '&.empty.drag-over-reject': {
      background: theme.colors.accent.red10,
    },
  },
  emptyView: {
    height: '300px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    textAlign: 'center',
    '& h4': {
      ...theme.typography.title,
      margin: `${theme.spacing.sm} 0 0`,
      color: theme.colors.text.primary,
    },
    '& span': {
      ...theme.typography.body,
      lineHeight: '18px',
      color: theme.colors.text.secondary,
    },
  },
  clip: {
    height: `${ClipHeight}px`,
    ...theme.typography.body,
    fontWeight: 500,
    color: theme.colors.text.primary,
    display: 'flex',
    alignItems: 'center',
    borderRadius: theme.sizes.borderRadius.card,
    width: '100%',
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    transition: 'all .1s',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: '2px',
    '& img': {
      opacity: 0.8,
    },
    '&:hover': {
      background: theme.colors.navigator.hover,
      color: theme.colors.text.pressed,
      '& img': {
        opacity: 1,
      },
    },
    '&.tutorial': {
      paddingLeft: '12px',
    },
    '&.completed': {
      opacity: 0.6,
      fontWeight: 400,
      color: theme.colors.text.secondary,
      '&:hover': {
        opacity: 1,
      },
    },
    '&.pressed': {
      opacity: 1,
      background: theme.colors.background.body,
      color: theme.colors.text.pressed,
      fontWeight: 600,
      '& img': {
        opacity: 1,
      },
    },
  },
  handle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: '-4px',
    width: '5px',
    cursor: 'ew-resize',
  },
  group: {
    position: 'relative',
  },
  clipHeader: {
    position: 'relative',
    height: `${HeaderHeight}px`,
    ...theme.typography.body,
    fontWeight: 600,
    color: theme.colors.text.primary,
    borderRadius: theme.sizes.borderRadius.card,
    marginTop: theme.spacing.xs,
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    gap: theme.spacing.sm,
    '& img': {
      opacity: 0.8,
    },
    '&:hover': {
      background: theme.colors.background.body,
      color: theme.colors.text.pressed,
      borderRadius: theme.sizes.borderRadius.card,
      '& img': {
        opacity: 1,
      },
    },
  },
  clipHeaderTutorialContainer: {
    position: 'sticky',
    top: '-8px',
    left: 0,
    right: 0,
    zIndex: 10,
    background: theme.colors.background.dark,
    borderRadius: 0,
    paddingTop: '1px',
    '&:after': {
      content: '" "',
      position: 'absolute',
      left: '-8px',
      bottom: '-4px',
      width: 'calc(100% + 16px)',
      height: '4px',
      background: theme.colors.background.dark,
    },
  },
  selected: {
    background: theme.colors.navigator.selected,
    '&.child': {
      background: theme.colors.primary.background10,
      color: theme.colors.primary.main,
      '& img': {
        filter: 'invert(0)',
      },
    },
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    transition: 'all .1s',
  },
  name: {
    flex: 1,
    height: '100%',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    '& input': {
      fontWeight: 'inherit',
      fontSize: 'inherit',
      padding: '0 2px',
      fontFamily: 'inherit',
      width: '100%',
      boxSizing: 'border-box',
      border: `1px solid ${theme.colors.accent.blue}`,
      borderRadius: theme.sizes.borderRadius.card,
      resize: 'none',
      transition: 'all .1s',
      '&::selection': {
        background: '#999',
      },
      '&::-moz-selection': {
        background: theme.colors.primary.background,
      },
    },
  },
  spacer: {
    width: '100%',
    height: '2px',
  },
  treeRoot: {
    flex: 1,
  },
  placeholderContainer: {
    position: 'relative',
  },
  placeholder: {
    backgroundColor: 'none',
    height: '2px',
    position: 'absolute',
    right: 0,
    transform: 'translateY(-50%)',
    top: 0,
  },
  draggingSource: {
    opacity: 0.5,
  },
  clipsFooter: {
    height: '40px',
  },
  error: {
    backgroundColor: theme.colors.accent.red,
    width: '18px',
    height: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '9px',
    fontWeight: 'bold',
  },
  warning: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '& img': {
      width: '24px',
      height: '24px',
    },
  },
  stereo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '& span': {
      width: '10px',
      height: '10px',
      border: '1px solid #fff',
      borderColor: 'unset',
      borderRadius: '5px',
    },
    '& span:first-child': {
      transform: 'translateX(3px)',
    },
    '& span:last-child': {
      transform: 'translateX(-2px)',
    },
    '& figcaption': {
      transition: 'opacity 0.1s ease-in-out',
      opacity: 0,
      position: 'absolute',
      top: '35px',
      color: theme.colors.text.primary,
      backgroundColor: 'black',
      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
      borderRadius: '2px',
      ...theme.typography.caption,
      whiteSpace: 'nowrap',
    },
    '&:hover figcaption': {
      opacity: 1,
      transitionDelay: '1s',
    },
  },
  circle: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: `2px solid ${theme.colors.background.pressed}`,
  },
  footer: {
    padding: `${theme.spacing.sm} 0`,
    '& button': {
      ...theme.typography.small,
    },
  },
  dirty: {
    position: 'absolute',
    left: '8px',
    top: 'calc(50% - 3px)',
    width: '6px',
    height: '6px',
    borderRadius: '3px',
    background: '#fff6',
  },
}));
