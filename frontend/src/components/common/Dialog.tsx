/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable react/no-danger */
import React, {useContext} from 'react';
import {useDispatch} from 'react-redux';
import {createAppStyle} from '../../styles/theme.style';
import {dialogActions} from '../../styles/shared.styles';
import {sanitizeHtml} from '../../utils/sanitizeHtml';
import {AppContext} from '../../containers/App';
import {DialogState} from '../../state/types';
import {useKeyboardEvent} from '../../hooks/useKeyboardEvent';
import {ZIndex, useStyles as useDialogStyle} from '../common/Dialog.style';
import CloseButton from './CloseButton';

const useStyles = createAppStyle(theme => ({
  description: {
    display: 'flex',
    color: theme.colors.text.secondary,
    whiteSpace: 'pre-line',
    ...theme.typography.body,
    marginBottom: theme.spacing.sm,
    padding: `0px ${theme.spacing.md}`,
  },
  actions: {
    ...dialogActions(theme),
  },
}));

interface DialogProps {
  dialog: DialogState;
}

/**
 * Full screen modal dialog with a confirm request
 */
export default function Dialog(props: DialogProps): JSX.Element {
  const classes = useStyles();
  const dialogClasses = useDialogStyle();
  const dispatch = useDispatch();
  const {dialog} = props;
  const {actions, lang} = useContext(AppContext);

  const onDismiss = () => {
    dispatch(actions.app.dismissDialog());
  };

  const onConfirm = () => {
    dispatch(actions.app.dismissDialog());
    if (dialog.action) {
      dispatch(dialog.action);
    }
  };

  /* Keyboard navigation */
  const keydown = React.useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          event.stopPropagation();
          onDismiss();
          break;
        case 'Enter': {
          event.preventDefault();
          event.stopPropagation();
          onConfirm();
          break;
        }
        default:
          break;
      }
    },
    [onConfirm, onDismiss],
  );
  useKeyboardEvent('keydown', keydown);

  return (
    <div
      className={dialogClasses.background}
      style={{zIndex: ZIndex.Dialog}}
      onClick={onDismiss}>
      <div
        className={`${dialogClasses.dialog} small`}
        onClick={e => e.stopPropagation()}>
        <div className={dialogClasses.header}>
          <h5 className={dialogClasses.title}>{dialog.title}</h5>
          <CloseButton
            onClick={() => onDismiss()}
            className={dialogClasses.close}
          />
        </div>
        <span
          className={classes.description}
          dangerouslySetInnerHTML={{__html: sanitizeHtml(dialog.text)}}
        />
        <div className={classes.actions}>
          <span className="hsbutton borderless" onClick={onDismiss}>
            {lang('global.cancel')}
          </span>
          <span className="hsbutton" onClick={onConfirm}>
            {dialog.confirmButton}
          </span>
        </div>
      </div>
    </div>
  );
}
