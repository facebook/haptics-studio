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
import CloseButton from '../common/CloseButton';

import ToastInfo from '../../images/toast-info.svg';

const useStyles = createAppStyle(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '16px 20px',
    background: theme.colors.background.dark,
    borderRadius: theme.sizes.borderRadius.toast,
    marginBottom: '24px',
    boxShadow: theme.shadows.dialogAlt,
    gap: '8px',
  },
  body: {
    width: '80%',
    '& a': {
      gap: '8px',
    },
  },
}));

function TelemetryNotification() {
  const {lang, actions, selectors} = useContext(AppContext);
  const dispatch = useDispatch();
  const classes = useStyles();

  const telemetryState = selectors.app.getTelemetryState();

  const bodyHtml = React.useMemo(
    () => markdownToSafeHtml(telemetryState.consentNotificationMarkdownText),
    [telemetryState.consentNotificationMarkdownText],
  );

  const onDismiss = () => {
    dispatch(actions.app.setTelemetryConsentNotificationShown());
  };

  return (
    <div className={classes.container}>
      <img src={ToastInfo} style={{alignSelf: 'self-start'}} />
      <div style={{display: 'flex', alignItems: 'center'}}>
        <div>
          <h4 style={{margin: 0, marginBottom: '4px'}}>
            {lang('telemetry.title')}
          </h4>
          <div
            className={classes.body}
            dangerouslySetInnerHTML={{__html: bodyHtml}}
          />
        </div>
        <CloseButton onClick={onDismiss} />
      </div>
    </div>
  );
}

export default React.memo(TelemetryNotification);
