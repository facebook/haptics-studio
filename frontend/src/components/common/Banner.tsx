/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {createAppStyle} from '../../styles/theme.style';

const useStyles = createAppStyle(theme => ({
  container: {
    position: 'relative',
    background: theme.colors.background.body,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '48px',
    borderRadius: theme.spacing.lg,
    padding: `${theme.spacing.lg} ${theme.spacing.lg} ${theme.spacing.lg} ${theme.spacing.xxl}`,
  },
  body: {
    flex: 5,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing.xxl,
  },
  imageContainer: {
    flex: 4,
    borderRadius: '10px',
    minHeight: '280px',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
  },
  tag: {
    ...theme.typography.small,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: theme.colors.text.secondary,
  },
  title: {
    ...theme.typography.title,
    margin: 0,
  },
  description: {
    ...theme.typography.heading,
    fontWeight: 400,
    lineHeight: '24px',
    color: theme.colors.text.secondary,
  },
  actionsContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: theme.spacing.sm,
  },
  dismissButton: {
    position: 'absolute',
    right: theme.spacing.xxl,
    top: theme.spacing.xxl,
    borderRadius: '50%',
    '&.lightBg': {
      backgroundColor: 'rgba(0,0,0,0.1)',
      '&:hover': {
        backgroundColor: 'rgba(0,0,0,0.15)',
      },
    },
  },
}));

interface Action {
  label: string;
  onClick: () => void;
  classes?: string;
}

export enum BannerSize {
  ExtraSmall = 'xs',
  Small = 'sm',
  Medium = 'md',
  Large = 'lg',
  ExtraLarge = 'xl',
}

interface Props {
  visible: boolean;

  tag?: string;
  title: string;
  subtitle: string;

  image?: string;
  isImageLight?: boolean;
  size?: BannerSize;

  actions?: Action[];
  onDismiss?: () => void;

  style?: React.CSSProperties;
}

const Sizes: Record<BannerSize, {imageHeight: number; bodyGap: number}> = {
  [BannerSize.ExtraSmall]: {imageHeight: 140, bodyGap: 12},
  [BannerSize.Small]: {imageHeight: 160, bodyGap: 12},
  [BannerSize.Medium]: {imageHeight: 180, bodyGap: 16},
  [BannerSize.Large]: {imageHeight: 200, bodyGap: 20},
  [BannerSize.ExtraLarge]: {imageHeight: 220, bodyGap: 24},
};

const closeCircleIcon = require('../../images/close-circle.svg');

function Banner(props: Props) {
  const classes = useStyles();
  const {
    visible,
    tag,
    title,
    subtitle,
    actions,
    onDismiss,
    image,
    isImageLight,
    size = 'lg',
    style,
  } = props;

  return visible ? (
    <div className={classes.container} style={style}>
      <div className={classes.body} style={{gap: `${Sizes[size].bodyGap}px`}}>
        {tag ? <span className={classes.tag}>{tag}</span> : null}
        <h2 className={classes.title}>{title}</h2>
        <span className={classes.description}>{subtitle}</span>
        {actions?.length ? (
          <div
            className={classes.actionsContainer}
            style={{marginTop: `${Sizes[size].bodyGap}px`}}>
            {actions.map((a, idx) => (
              <button
                className={`hsbutton ${a.classes ?? ''}`}
                type="button"
                key={idx}
                onClick={() => a.onClick()}>
                {a.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {image ? (
        <div
          className={classes.imageContainer}
          style={{
            backgroundImage: `url(${image})`,
            minHeight: `${Sizes[size].imageHeight}px`,
          }}
        />
      ) : null}
      {onDismiss ? (
        <button
          type="button"
          data-testid="close-button"
          className={`hsbutton icon borderless ${classes.dismissButton} ${isImageLight ? 'lightBg' : ''}`}
          onClick={() => onDismiss()}>
          <img src={closeCircleIcon} />
        </button>
      ) : null}
    </div>
  ) : null;
}

Banner.defaultProps = {
  tag: undefined,
  actions: undefined,
  onDismiss: undefined,
  size: 'lg',
  image: undefined,
  isImageLight: false,
  style: undefined,
};

export default React.memo(Banner);
