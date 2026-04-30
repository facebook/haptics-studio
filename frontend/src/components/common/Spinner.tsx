/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {createAppStyle} from '../../styles/theme.style';

const useStyles = createAppStyle({
  container: {
    position: 'relative',
  },
  spinner: {
    position: 'absolute',
    left: 0,
    top: 0,
    animation: 'rotate 0.8s infinite linear',
    borderWidth: '4px',
    borderStyle: 'solid',
    borderRightColor: 'transparent !important',
    borderRadius: '50%',
  },
  spinnerBg: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderWidth: '5px',
    borderStyle: 'solid',
    borderRadius: '50%',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  small: {
    borderTopWidth: '2px',
    borderLeftWidth: '2px',
    borderBottomWidth: '2px',
    borderRightWidth: '2px',
  },
  absolute: {
    position: 'absolute',
    top: '50%',
    left: '50%',
  },
});

interface SpinnerProps {
  size?: number;
  absolute?: boolean;
  color?: string;
  margin?: number;
  small?: boolean;
}

/**
 * Spinner component
 * @param {number} props.size pixel size of the spinner (both width and height are equal)
 * @param {boolean} props.absolute set the spiner as display: absolute
 * @param {string} props.color set the spiner color
 */
export default function Spinner(props: SpinnerProps): JSX.Element {
  const {size = 32, absolute = false, margin = 10, color = 'white'} = props;
  const classes = useStyles();

  let view = (
    <div
      role="status"
      className={classes.container}
      style={{width: `${size}px`, height: `${size}px`, margin: `${margin}px`}}>
      <div
        className={`${classes.spinnerBg} ${size <= 24 || props.small ? classes.small : ''}`}
        style={{width: `${size}px`, height: `${size}px`}}
      />
      <div
        className={`${classes.spinner} ${size <= 24 || props.small ? classes.small : ''}`}
        style={{width: `${size}px`, height: `${size}px`, borderColor: color}}
      />
    </div>
  );

  if (absolute) {
    view = (
      <div
        role="status"
        className={`${classes.container} ${classes.absolute}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          marginLeft: `-${size / 2}px`,
          marginTop: `-${size / 2}px`,
        }}>
        <div
          className={`${classes.spinnerBg} ${size <= 24 || props.small ? classes.small : ''}`}
          style={{width: `${size}px`, height: `${size}px`}}
        />
        <div
          className={`${classes.spinner} ${size <= 24 || props.small ? classes.small : ''}`}
          style={{width: `${size}px`, height: `${size}px`, borderColor: color}}
        />
      </div>
    );
  }

  return view;
}
