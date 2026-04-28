/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {useSpring, animated} from '@react-spring/web';

import {createAppStyle, theme} from '../../styles/theme.style';

const useStyles = createAppStyle(theme => ({
  button: {
    padding: '0.5rem 0',
    background: 'transparent',
    border: '0',
    fontSize: '1rem',
    display: 'flex',
    color: theme.colors.text.secondary,
    marginRight: '0.5rem',
  },
  check: {
    height: '24px',
    display: 'flex',
    marginRight: '0.5rem',
    '& img': {
      width: '18px',
    },
  },
  container: {
    borderRadius: '18px',
    width: '40px',
    padding: '2px',
    display: 'flex',
    opacity: 0.8,
    transition: 'opacity 0.1s ease-in-out',
    '&:hover': {
      opacity: 1,
    },
  },
  handle: {
    borderRadius: '10px',
    width: '20px',
    height: '20px',
    background: 'white',
  },
  content: {
    fontSize: theme.sizes.text.side,
    lineHeight: '1.25rem',
  },
}));

/**
 * Customized toggle switch component
 * @param {boolean} props.checked indicates the toggle state
 * @param {function} props.onChange the onChange function
 */
function ToggleSwitch(props: {
  checked: boolean;
  onChange: () => void;
  children?: any;
}) {
  const classes = useStyles();

  const handleSpring = useSpring({
    translate: props.checked ? '80%' : '0',
    backgroundColor: props.checked
      ? theme.colors.switch.handleOn
      : theme.colors.switch.handleOff,
  });
  const constainerSpring = useSpring({
    backgroundColor: props.checked
      ? theme.colors.switch.backgroundOn
      : theme.colors.switch.backgroundOff,
  });

  return (
    <button
      type="button"
      className={classes.button}
      onClick={() => props.onChange()}>
      <div className={classes.check}>
        <animated.div
          style={{...constainerSpring}}
          className={classes.container}>
          <animated.div style={{...handleSpring}} className={classes.handle} />
        </animated.div>
      </div>
      <div className={classes.content}>{props.children}</div>
    </button>
  );
}

ToggleSwitch.defaultProps = {
  children: undefined,
};

export default React.memo(ToggleSwitch);
