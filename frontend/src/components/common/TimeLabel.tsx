/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {timeFormat} from '../../globals/utils';
import {createAppStyle, theme} from '../../styles/theme.style';

import CheckmarkIcon from '../../images/checkmark-icon.svg';
import DeleteIcon from '../../images/icon-delete.svg';

const useStyles = createAppStyle({
  container: {
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    color: theme.colors.text.dark,
    borderRadius: '5px',
    boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.25)',
    fontSize: '11px',
    '& span': {
      padding: '2px 8px',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '5px 0 0 5px',
      backgroundColor: theme.colors.primary.main,
    },
    '& button': {
      width: '30px',
      backgroundColor: theme.colors.background.light,
      height: '100%',
      borderLeft: `1px solid ${theme.colors.background.dark}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'none',
      background: 'none',
      '&:last-child': {
        borderRadius: '0 5px 5px 0',
      },
      '&:hover': {
        cursor: 'pointer',
        filter: 'brightness(1.1)',
      },
      '& img': {
        width: '12px',
        height: '12px',
      },
    },
  },
});

interface Props {
  time: number;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Shows the time as a label and the button to confirm and reset the action (e.g. trim or paste)
 */
function TimeLabel(props: Props) {
  const classes = useStyles();
  const {time, onCancel, onConfirm} = props;

  return (
    <div className={classes.container}>
      <span>{timeFormat(time)}</span>
      <button data-testid="timelabel-confirm" type="button" onClick={onConfirm}>
        <img src={CheckmarkIcon} alt="Confirm" />
      </button>
      <button data-testid="timelabel-cancel" type="button" onClick={onCancel}>
        <img src={DeleteIcon} alt="Cancel" />
      </button>
    </div>
  );
}

export default React.memo(TimeLabel);
