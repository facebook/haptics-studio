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
import ToggleSwitch from '../common/ToggleSwitch';
import {ZIndex, useStyles as useDialogStyle} from '../common/Dialog.style';

import CloseIcon from '../../images/icon-close.svg';

const useStyles = createAppStyle(theme => ({
  body: {
    width: '100%',
    marginTop: '-16px',
    padding: '24px',
    '& a': {
      color: theme.colors.text.primary,
    },
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    gap: '16px',
    padding: '24px',
    borderTop: `1px solid ${theme.colors.items.separator}`,
    '& button': {
      flex: 1,
      border: 'none',
      borderRadius: theme.sizes.borderRadius.card,
      padding: '10px',
      '&:hover': {
        filter: 'brightness(0.9)',
      },
    },
    '& button:first-child': {
      color: theme.colors.text.primary,
      backgroundColor: theme.colors.background.hover,
    },
  },
}));

/**
 * Full screen modal with the consent information for telemetry
 */
export default function TelemetryDialog(props: {
  showSettings: boolean;
}): JSX.Element {
  const {showSettings} = props;
  const classes = useStyles();
  const dialogClasses = useDialogStyle();
  const dispatch = useDispatch();
  const {actions, lang, selectors} = useContext(AppContext);

  const telemetryState = selectors.app.getTelemetryState();

  const [consent, setConsent] = React.useState(telemetryState.hasConsent);

  React.useEffect(() => {
    setConsent(telemetryState.hasConsent);
  }, [telemetryState.hasConsent]);

  const bodyHtml = React.useMemo(
    () =>
      markdownToSafeHtml(
        showSettings
          ? telemetryState.settingsChangeText
          : telemetryState.consentMarkdownText,
      ),
    [telemetryState.consentMarkdownText, showSettings],
  );

  const onDismiss = () => {
    if (!showSettings) return;
    dispatch(actions.app.dismissTelemetrySettingsDialog());
  };

  const onConsentClick = (consent: boolean) => {
    dispatch(actions.app.saveTelemetryConsent({consent}));
  };

  const onConsentSettingChange = (consent: boolean) => {
    setConsent(consent);
    dispatch(actions.app.saveTelemetryConsent({consent}));
  };

  return (
    <div className={dialogClasses.background} style={{zIndex: ZIndex.System}}>
      <div className={dialogClasses.dialog} onClick={e => e.stopPropagation()}>
        <div className={dialogClasses.header}>
          <h5 className={dialogClasses.title}>{lang('telemetry.title')}</h5>
          {showSettings ? (
            <button
              className={`hsbutton icon secondary ${dialogClasses.close}`}
              type="button"
              onClick={() => onDismiss()}>
              <img src={CloseIcon} alt="Close" />
            </button>
          ) : null}
        </div>
        <div className={classes.body}>
          <div className={classes.container}>
            <h5 className={dialogClasses.title}>
              {telemetryState.consentTitle}
            </h5>
            {showSettings && telemetryState.isConsentSettingsChangeEnabled ? (
              <ToggleSwitch
                checked={consent}
                onChange={() => onConsentSettingChange(!consent)}
              />
            ) : null}
          </div>
          <div dangerouslySetInnerHTML={{__html: bodyHtml}} />
        </div>
        {!showSettings ? (
          <div className={classes.actions}>
            <button
              type="button"
              data-testid="telemetry-essential"
              onClick={() => onConsentClick(false)}>
              {lang('telemetry.essentials-only')}
            </button>
            <button
              type="button"
              data-testid="telemetry-additional"
              onClick={() => onConsentClick(true)}>
              {lang('telemetry.additional-data')}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
