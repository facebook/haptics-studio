/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useContext} from 'react';
import {useDispatch} from 'react-redux';
import {createAppStyle} from '../../styles/theme.style';
import {AppContext} from '../../containers/App';
import LinearProgressBar from '../common/LinearProgressBar';

const useStyles = createAppStyle(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
    background: theme.colors.background.dark,
    borderRadius: theme.sizes.borderRadius.toast,
    boxShadow: theme.shadows.dialogAlt,
    minHeight: '80px',
    marginBottom: theme.spacing.xxl,
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
  link: {
    color: theme.colors.text.primary,
    transition: 'all .1s',
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
}));

const greenCheckIcon = require('../../images/icon-check-circle-green.svg');

function UpdaterPrompt() {
  const {lang, actions, selectors} = useContext(AppContext);
  const dispatch = useDispatch();
  const classes = useStyles();
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
  if (toDownload) {
    subtitle = (
      <span className={classes.subtitle}>
        {lang('updater.update-available', {version: updateInfo.version})}&nbsp;
        {updateInfo.releaseNotes ? (
          <span
            className={classes.link}
            onClick={() => {
              dispatch(actions.app.showUpdateReleaseNotes({visible: true}));
            }}>
            {lang('updater.action-learn-more')}
          </span>
        ) : null}
      </span>
    );
  } else if (toInstall) {
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

  return (
    <div className={classes.container}>
      <div style={{display: 'flex', flexDirection: 'column'}}>
        <h4 style={{margin: 0, marginBottom: '4px'}}>
          {lang('updater.title')}
        </h4>
        {subtitle}
      </div>
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
  );
}

export default React.memo(UpdaterPrompt);
