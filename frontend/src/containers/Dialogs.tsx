/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useContext} from 'react';
import {TransitionGroup, CSSTransition} from 'react-transition-group';
import {AppContext} from './App';
import Dialog from '../components/common/Dialog';
import Snackbar from '../components/common/Snackbar';
import UpdaterDialog from '../components/home/UpdaterDialog';
import BugReportDialog from '../components/bugreport/BugReportDialog';
import TutorialSettings from '../components/tutorial/TutorialSettings';
import TelemetryDialog from '../components/home/TelemetryDialog';

/**
 * Mount point for the dialogs that can be shown in the app
 */
function Dialogs() {
  const {selectors, lang} = useContext(AppContext);
  const {dialog, showBugReportDialog, updateDialog} = selectors.app.getOverlays();
  const snackbar = selectors.app.getSnackbarState();
  const {showSettings} = selectors.app.getTutorialEditorState();
  const shouldShowTelemetryDialog = selectors.app.shouldShowTelemetryConsent();
  const shouldShowTelemetrySettingsDialog =
    selectors.app.shouldShowTelemetrySettings();

  return (
    <div>
      <TransitionGroup>
        {dialog.visible ? (
          <CSSTransition
            key="dialog"
            classNames="fade"
            timeout={{enter: 200, exit: 200}}>
            <Dialog dialog={dialog} />
          </CSSTransition>
        ) : null}
        {showSettings ? (
          <CSSTransition
            key="tutorial-settings-dialog"
            classNames="fade"
            timeout={{enter: 200, exit: 200}}>
            <TutorialSettings />
          </CSSTransition>
        ) : null}
        {updateDialog ? (
          <CSSTransition
            key="updater-dialog"
            classNames="fade"
            timeout={{enter: 200, exit: 200}}>
            <UpdaterDialog />
          </CSSTransition>
        ) : null}
        {shouldShowTelemetryDialog || shouldShowTelemetrySettingsDialog ? (
          <CSSTransition
            key="updater-dialog"
            classNames="fade"
            timeout={{enter: 200, exit: 200}}>
            <TelemetryDialog showSettings={shouldShowTelemetrySettingsDialog} />
          </CSSTransition>
        ) : null}
        {snackbar ? (
          <CSSTransition
            key="banner"
            classNames="slide"
            timeout={{enter: 200, exit: 200}}>
            <Snackbar
              autoDismiss={snackbar.autoDismiss}
              isDismissable
              text={
                snackbar.textKey ? lang(snackbar.textKey) : snackbar.text || ''
              }
              type={snackbar.type}
              action={snackbar.action}
            />
          </CSSTransition>
        ) : null}
{showBugReportDialog ? (
          <CSSTransition
            key="bugreport-dialog"
            classNames="fade"
            timeout={{enter: 200, exit: 200}}>
            <BugReportDialog />
          </CSSTransition>
        ) : null}
      </TransitionGroup>
    </div>
  );
}

export default React.memo(Dialogs);
