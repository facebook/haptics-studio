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
import {markdownToSafeHtml} from '../../utils/sanitizeHtml';
import {AppContext} from '../../containers/App';
import LinearProgressBar from '../common/LinearProgressBar';
import {ZIndex, useStyles as useDialogStyle} from '../common/Dialog.style';

const useStyles = createAppStyle(theme => ({
  body: {
    width: '100%',
    marginTop: `-${theme.spacing.lg}`,
    padding: `0px ${theme.spacing.md}`,
    overflowY: 'auto',
    maxHeight: '400px',
  },
  subtitle: {
    width: '100%',
    ...theme.typography.body,
    lineHeight: '18px',
    color: theme.colors.text.secondary,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  success: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    ...theme.typography.body,
    gap: theme.spacing.sm,
    color: theme.colors.text.secondary,
  },
  releaseNotes: {
    width: '100%',
    margin: `${theme.spacing.lg} 0px ${theme.spacing.sm}`,
    color: theme.colors.text.secondary,
    ...theme.typography.heading,
    fontWeight: 400,
    lineHeight: '20px',
    '& *': {
      fontSize: '16px',
      lineHeight: '20px',
      textAlign: 'left',
    },
    '& h1, & h2, & h3, & h4, & h5, & h6': {
      fontWeight: 600,
      color: theme.colors.text.primary,
      marginBottom: '.5rem',
      marginTop: '1rem',
    },
    '& a, & a:focus, & a:visited': {
      textDecoration: 'underline',
      color: theme.colors.text.secondary,
    },
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: theme.spacing.sm,
    padding: `${theme.spacing.sm} ${theme.spacing.md} ${theme.spacing.lg} ${theme.spacing.xxl}`,
  },
}));

const closeIcon = require('../../images/icon-close.svg');
const greenCheckIcon = require('../../images/icon-check-circle-green.svg');

function UpdaterDialog() {
  const {lang, actions, selectors} = useContext(AppContext);
  const dispatch = useDispatch();
  const classes = useStyles();
  const dialogClasses = useDialogStyle();
  const updateInfo = selectors.app.getUpdaterInfo();

  if (!updateInfo) return null;

  const toDownload = !updateInfo.downloaded && updateInfo.progress === null;
  const toInstall = updateInfo.downloaded;

  const onCallToAction = () => {
    if (toDownload) {
      dispatch(actions.app.updateDownloadProgress({progress: 0}));
      dispatch(actions.app.downloadUpdate());
    } else if (toInstall) {
      dispatch(actions.app.quitAndInstall());
    }
  };

  let subtitle = null;
  if (toInstall) {
    subtitle = (
      <span className={classes.success}>
        <img src={greenCheckIcon} alt="" /> {lang('updater.update-downloaded')}
      </span>
    );
  } else if (updateInfo.progress !== null) {
    subtitle = (
      <span className={classes.subtitle}>
        <LinearProgressBar
          progress={updateInfo.progress}
          style={{width: '200px', marginRight: '16px'}}
        />
        {lang('updater.update-progress', {progress: updateInfo.progress})}
      </span>
    );
  }

  const onDismiss = () => {
    dispatch(actions.app.showUpdateReleaseNotes({visible: false}));
  };

  const htmlReleaseNotes = React.useMemo(
    () => markdownToSafeHtml(updateInfo.releaseNotes),
    [updateInfo.releaseNotes],
  );

  return (
    <div
      className={dialogClasses.background}
      style={{zIndex: ZIndex.Dialog}}
      onClick={onDismiss}>
      <div className={dialogClasses.dialog} onClick={e => e.stopPropagation()}>
        <div className={dialogClasses.header}>
          <h5 className={dialogClasses.title}>
            {lang('updater.release-notes-title')}
          </h5>
          <button
            className={`hsbutton icon secondary ${dialogClasses.close}`}
            type="button"
            onClick={() => onDismiss()}>
            <img src={closeIcon} alt="Close" />
          </button>
        </div>
        <div className={`${classes.body} scrollbar`}>
          <div
            className={classes.releaseNotes}
            dangerouslySetInnerHTML={{__html: htmlReleaseNotes}}
          />
        </div>
        <div className={classes.actions}>
          {subtitle}
          <button
            type="button"
            className={`hsbutton ${toInstall || toDownload ? '' : 'disabled'}`}
            style={{marginLeft: 'auto'}}
            onClick={() => onCallToAction()}>
            {lang(
              `updater.${!updateInfo.downloaded ? 'action-download' : 'action-install'}`,
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(UpdaterDialog);
