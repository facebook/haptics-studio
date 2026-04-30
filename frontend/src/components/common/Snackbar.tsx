/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {clipboard, shell} from 'electron';
import {useDispatch} from 'react-redux';
import React, {useContext, useEffect, useState} from 'react';
import {CircularProgressbar} from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

import {createAppStyle, theme} from '../../styles/theme.style';
import {ZIndex} from '../../styles/zIndex';
import {AppContext} from '../../containers/App';
import {SnackbarAutoDismissTime} from '../../globals/constants';
import {SnackbarAction, SnackbarType} from '../../state/types';

import CopyIcon from '../../images/copy.svg';
import SuccessIcon from '../../images/toast-success.svg';
import InfoIcon from '../../images/toast-info.svg';
import ErrorIcon from '../../images/toast-error.svg';
import CloseIcon from '../../images/icon-close.svg';

const useStyles = createAppStyle(theme => ({
  container: {
    width: '580px',
    background: theme.colors.snackbar.background,
    position: 'fixed',
    bottom: theme.spacing.xxl,
    right: theme.spacing.xxl,
    maxWidth: 'calc(100vw - 48px)',
    borderRadius: theme.sizes.borderRadius.toast,
    color: theme.colors.text.selected,
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    zIndex: ZIndex.TopLevel,
    ...theme.typography.body,
    lineHeight: '16px',
    userSelect: 'text',
    display: 'flex',
    gap: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow:
      '0px 0px 32px 0px rgba(39, 39, 39, 0.05), 0px 16px 48px 0px rgba(39, 39, 39, 0.05), 1px 1px 1px 0px #FFF inset, -1px -1px 1px 0px rgba(39, 39, 39, 0.05) inset',
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.lg,
    '& img': {
      alignSelf: 'flex-start',
    },
  },
  action: {
    marginLeft: theme.spacing.lg,
    textTransform: 'capitalize',
  },
  actions: {
    display: 'flex',
  },
}));

interface Props {
  isDismissable: boolean;
  autoDismiss: boolean;
  text: string;
  type: SnackbarType;
  action: SnackbarAction | undefined;
}

/**
 * UI panel that shows an error string from the Redux state
 * @param {boolean} props.isDismissable Boolean that enables the "Dismiss" button
 * @param {string} props.error The error string
 */
export default function Snackbar(props: Props): JSX.Element {
  const classes = useStyles();
  const dispatch = useDispatch();
  const {text, isDismissable, autoDismiss, type, action} = props;
  const {actions} = useContext(AppContext);
  const [elapsed, setElapsed] = useState(0);
  const [canHover, setCanHover] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | undefined>();

  useEffect(() => {
    setElapsed(0);
  }, [text]);

  useEffect(() => {
    // Set the autodismiss
    if (autoDismiss) {
      const t = setInterval(() => {
        setElapsed(e => e + 1);
      }, 1000);
      setTimer(t);
      return () => clearTimeout(t);
    }

    setTimer(undefined);

    return () => undefined;
  }, [autoDismiss]);

  /**
   * If an autodismiss snackbar pops in under the current mouse position (like when clicking the export button at the bottom of the screen)
   * the hover registers right away, so the autodismiss is useless. This defers the hover event by a second, giving a chance of escape to the mouse
   */
  useEffect(() => {
    const t = setInterval(() => {
      setCanHover(true);
    }, 1000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (elapsed >= SnackbarAutoDismissTime) {
      if (timer) {
        clearTimeout(timer);
      }
      dispatch(actions.app.dismissSnackbar());
    }
  }, [elapsed]);

  const onDismiss = () => {
    dispatch(actions.app.dismissSnackbar());
  };

  const onMouseOver = () => {
    // Cancel the autodismiss on hover
    if (timer && canHover) {
      clearTimeout(timer);
      setTimer(undefined);
    }
  };

  const onAction = () => {
    if (action?.startsWith('http://') || action?.startsWith('https://')) {
      void shell.openExternal(action);
    }
    dispatch(actions.app.dismissSnackbar());
  };

  let actionName: string = action ?? '';
  if (action?.startsWith('http://') || action?.startsWith('https://')) {
    actionName = 'More info';
  }

  let icon = InfoIcon;
  switch (type) {
    case SnackbarType.Error:
      icon = ErrorIcon;
      break;
    case SnackbarType.Success:
      icon = SuccessIcon;
      break;
    case SnackbarType.Info:
      icon = InfoIcon;
      break;
    default:
      break;
  }

  return (
    <div
      data-testid="snackbar"
      className={`${classes.container}`}
      onMouseOver={onMouseOver}
      onFocus={onMouseOver}>
      <div className={classes.content}>
        <img src={icon} alt={type} />
        <span>{text}</span>
        {action ? (
          <span
            className={`hsbutton secondary invert ${classes.action}`}
            onClick={onAction}>
            {actionName}
          </span>
        ) : null}
      </div>
      <div className={classes.actions}>
        {type === SnackbarType.Error ? (
          <button
            className="hsbutton borderless square invert"
            data-testid="copy-button"
            type="button"
            onClick={() => clipboard.writeText(text)}>
            <img src={CopyIcon} alt="Copy" />
          </button>
        ) : null}
        {isDismissable ? (
          <button
            type="button"
            className="hsbutton borderless square invert"
            onClick={onDismiss}>
            {timer ? (
              <CircularProgressbar
                value={(elapsed / SnackbarAutoDismissTime) * 100}
                strokeWidth={12}
                styles={{
                  root: {
                    width: 20,
                    height: 20,
                  },
                  path: {
                    stroke: 'white',
                    strokeLinecap: 'round',
                    transition: 'stroke-dashoffset 0.5s ease 0s',
                  },
                  trail: {
                    stroke: theme.colors.text.selected,
                    strokeLinecap: 'round',
                  },
                }}
              />
            ) : (
              <img src={CloseIcon} alt="Close" />
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}
