/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {shell} from 'electron';
import {createAppStyle} from '../../../../styles/theme.style';

const useStyles = createAppStyle(theme => ({
  item: {
    minHeight: '60px',
    height: '100%',
    color: theme.colors.text.secondary,
    borderRadius: theme.sizes.borderRadius.roundedCard,
    background: theme.colors.background.body,
    width: '100%',
    transition: 'all .1s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: '8px',
    overflow: 'hidden',
    '&:hover': {
      background: theme.colors.background.secondaryButtonHover,
      color: theme.colors.text.primary,
    },
    '&:last-of-type': {
      alignSelf: 'flex-start',
    },
  },
  imageContainer: {
    transition: '.5s all',
    height: '200px',
    width: '100%',
    overflow: 'hidden',
    '& > img': {
      objectFit: 'cover',
      height: '100%',
      width: '100%',
      '&:hover': {
        filter: 'brightness(1.1)',
      },
    },
  },
  itemContent: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    flex: 1,
    padding: '16px 20px',
    '& .tag': {
      whiteSpace: 'nowrap',
      width: 'min-content',
      fontSize: '12px',
      lineHeight: '16px',
      color: theme.colors.text.tag,
      background: theme.colors.background.tag,
      padding: '3px 6px',
      borderRadius: '4px',
      textTransform: 'capitalize',
    },
    '& .new': {
      color: theme.colors.button.primary.main,
    },
    '& .name': {
      fontWeight: 600,
      fontSize: '16px',
      lineHeight: '20px',
      color: theme.colors.text.primary,
    },
    '& .info': {
      color: theme.colors.text.secondary,
      fontWeight: 400,
      fontSize: '14px',
      lineHeight: '20px',
      display: 'inline-block',
      paddingTop: '4px',
      marginBottom: '8px',
      '&:empty:before': {
        content: '"\u00a0"',
      },
    },
  },
}));

export interface Resource {
  new?: boolean;
  category: string;
  title: string;
  description: string;
  image: string;
  url: string;
}

interface Props {
  resource: Resource;
}

export default function ResourceCard(props: Props): JSX.Element {
  const {category, title, description, image, url, new: isNew} = props.resource;
  const classes = useStyles();

  const onOpenLink = () => {
    void shell.openExternal(url);
  };

  return (
    <div
      data-testid="resource-card"
      role="button"
      className={classes.item}
      onClick={onOpenLink.bind(null)}>
      <div className={classes.imageContainer}>
        <img
          className="to-scale"
          src={require(`../../../../images/${image}`)}
        />
      </div>
      <div className={classes.itemContent}>
        <span className="name">{title}</span>
        <span className="info">{description}</span>
        {isNew ? (
          <span className="tag new">NEW</span>
        ) : (
          <span className="tag">{category.toLowerCase()}</span>
        )}
      </div>
    </div>
  );
}
