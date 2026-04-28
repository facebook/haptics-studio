/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useContext} from 'react';
import {useDispatch} from 'react-redux';
import {clipboard} from 'electron';
import {createAppStyle} from '../../styles/theme.style';
import {dialogActions} from '../../styles/shared.styles';
import {AppContext} from '../../containers/App';
import {SnackbarType} from '../../state/types';
import CloseButton from '../common/CloseButton';
import {ZIndex, useStyles as useDialogStyle} from '../common/Dialog.style';

import CopyIcon from '../../images/copy.svg';

const useStyles = createAppStyle(theme => ({
  body: {
    width: '100%',
    marginTop: `-${theme.spacing.lg}`,
    padding: `0px ${theme.spacing.md}`,
  },
  description: {
    width: '100%',
    display: 'block',
    color: theme.colors.text.secondary,
    whiteSpace: 'pre-line',
    ...theme.typography.body,
    margin: `${theme.spacing.lg} 0px ${theme.spacing.sm}`,
    '& a': {
      color: theme.colors.text.secondary,
      textDecoration: 'underline',
    },
  },
  input: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minWidth: '450px',
    margin: `${theme.spacing.md} 0px ${theme.spacing.xxl}`,
    backgroundColor: theme.colors.input.background,
    borderRadius: theme.sizes.borderRadius.card,
    padding: `6px ${theme.spacing.sm} 6px ${theme.spacing.md}`,
    fontFamily: 'inherit',
    ...theme.typography.bodyBold,
    width: '100%',
    boxSizing: 'border-box',
    border: `1px solid ${theme.colors.input.border}`,
    resize: 'none',
    transition: 'all .1s',
    color: theme.colors.text.primary,
  },
  template: {
    color: theme.colors.text.secondary,
    whiteSpace: 'pre-line',
  },
  actions: {
    ...dialogActions(theme),
  },
}));

/**
 * Full screen bug report dialog
 */
export default function BugReportDialog(): JSX.Element {
  const classes = useStyles();
  const dialogClasses = useDialogStyle();
  const dispatch = useDispatch();
  const {actions, selectors, lang} = useContext(AppContext);
  const windowInfo = selectors.app.getWindowInformation();

  const onCopy = (text: string) => {
    clipboard.writeText(text);
    dispatch(
      actions.app.showSnackbar({
        text: lang('bugreport.copied'),
        snackbarType: SnackbarType.Success,
        autoDismiss: true,
        action: undefined,
      }),
    );
  };

  const onDismiss = () => {
    dispatch(actions.app.dismissBugReportDialog());
  };

  const templateBody = lang('bugreport.template-body', {
    version: windowInfo.version,
    platform: windowInfo.isOnWindows ? 'Windows' : 'macOS',
  });

  return (
    <div
      className={dialogClasses.background}
      style={{zIndex: ZIndex.Popover}}
      onClick={onDismiss}>
      <div
        className={`${dialogClasses.dialog} small`}
        onClick={e => e.stopPropagation()}>
        <div className={dialogClasses.header}>
          <h5 className={dialogClasses.title}>{lang('bugreport.title')}</h5>
          <CloseButton className={dialogClasses.close} onClick={onDismiss} />
        </div>
        <div className={classes.body}>
          <span
            className={classes.description}
            dangerouslySetInnerHTML={{
              __html: lang('bugreport.subtitle'),
            }}
          />

          <span className={classes.description}>
            {lang('bugreport.template-subtitle')}
          </span>
          <div className={classes.input}>
            <span className={classes.template}>{templateBody}</span>
            <button
              className="hsbutton icon secondary borderless dark"
              type="button"
              onClick={() => onCopy(templateBody)}>
              <img src={CopyIcon} alt="Copy" />
            </button>
          </div>
        </div>
        <div className={classes.actions}>
          <span className="hsbutton" onClick={onDismiss}>
            {lang('global.action-done')}
          </span>
        </div>
      </div>
    </div>
  );
}
