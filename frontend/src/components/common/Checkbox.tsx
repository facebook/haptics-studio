/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';

import {createAppStyle} from '../../styles/theme.style';
import checkboxOn from '../../images/checkbox-on.svg';
import checkboxOff from '../../images/checkbox-off.svg';

const useStyles = createAppStyle(theme => ({
  container: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    userSelect: 'none',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    flexShrink: 0,
    '& img': {
      width: '100%',
      height: '100%',
      display: 'block',
    },
  },
  label: {
    width: '100%',
    color: theme.colors.text.primary,
    ...theme.typography.body,
  },
}));

interface CheckboxProps {
  checked: boolean;
  onChange: () => void;
  children?: React.ReactNode;
  position?: 'left' | 'right';
}

/**
 * Customized checkbox component with SVG icons
 * @param props.checked indicates the checkbox state
 * @param props.onChange the onChange function
 * @param props.children the label content
 * @param props.position position of the checkbox relative to the label (default: 'left')
 */
function Checkbox(props: CheckboxProps) {
  const classes = useStyles();
  const {checked, onChange, children, position = 'left'} = props;

  const checkboxElement = (
    <div className={classes.checkbox}>
      <img src={checked ? checkboxOn : checkboxOff} alt="" />
    </div>
  );

  const labelElement = children && (
    <div className={classes.label}>{children}</div>
  );

  return (
    <div
      className={classes.container}
      onClick={onChange}
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onChange();
        }
      }}>
      {position === 'left' ? (
        <>
          {checkboxElement}
          {labelElement}
        </>
      ) : (
        <>
          {labelElement}
          {checkboxElement}
        </>
      )}
    </div>
  );
}

export default React.memo(Checkbox);
