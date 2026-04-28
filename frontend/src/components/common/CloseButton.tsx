/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {createAppStyle} from '../../styles/theme.style';

import closeIcon from '../../images/icon-close.svg';

const useStyles = createAppStyle(theme => ({
  button: {
    '-webkit-app-region': 'no-drag',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '30px',
    minWidth: '30px',
    padding: '5px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.1s linear',
    '&:hover': {
      backgroundColor: theme.colors.background.tag,
    },
    '& img': {
      width: '20px',
      height: '20px',
      objectFit: 'contain',
    },
  },
}));

interface CloseButtonProps {
  onClick: (e?: React.MouseEvent) => void;
  className?: string;
  'aria-label'?: string;
}

function CloseButton({
  onClick,
  className,
  'aria-label': ariaLabel = 'Close',
}: CloseButtonProps) {
  const classes = useStyles();

  return (
    <button
      data-testid="close-button"
      type="button"
      className={`${classes.button}${className ? ` ${className}` : ''}`}
      onClick={e => onClick(e)}
      aria-label={ariaLabel}>
      <img src={closeIcon} alt="" />
    </button>
  );
}

export default CloseButton;
