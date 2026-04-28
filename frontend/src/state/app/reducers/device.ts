/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {PayloadAction} from '@reduxjs/toolkit';
import {TelemetryConsentState} from 'main/src/analytics';
import {Device, UpdateState, WindowInformation, UpdateInfo} from '../../types';
import {TermsAcceptedKey} from '../../../globals/constants';

export interface DeviceState {
  wsAuthCode?: string;
  connectedDevices: {[serial: string]: Device};
  showDevicePanel: boolean;
  windowInformation: WindowInformation;
  termsAccepted: boolean;
  updater: UpdateState | undefined;
  telemetry: TelemetryConsentState;
}

export const deviceInitialState: DeviceState = {
  connectedDevices: {},
  showDevicePanel: false,
  windowInformation: {
    title: '',
    size: [0, 0],
    isCurrentProjectDirty: false,
    fullScreen: false,
    isOnWindows: false,
    projectName: '',
    version: '',
    flags: {},
  },
  termsAccepted: true,
  updater: undefined,
  telemetry: {
    shouldShowTelemetryConsentWindow: false,
    shouldShowTelemetryNotification: false,
    consentTitle: '',
    consentMarkdownText: '',
    consentNotificationMarkdownText: '',
    settingsChangeText: '',
    isConsentSettingsChangeEnabled: false,
    hasConsent: false,
  },
};

export const deviceReducers = {
  requestWSAuthCode() {},

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  disconnectWSDevice(
    _state: DeviceState,
    _action: PayloadAction<{deviceId: string}>,
  ) {},

  toggleDevicePanelState(
    state: {showDevicePanel: boolean},
    action: PayloadAction<{open: boolean}>,
  ) {
    state.showDevicePanel = action.payload.open;
  },

  setWSAuthCode(
    state: {wsAuthCode?: string},
    action: PayloadAction<{wsAuthCode: string}>,
  ) {
    state.wsAuthCode = action.payload.wsAuthCode;
  },

  setConnectedDevices(
    state: {connectedDevices: DeviceState['connectedDevices']},
    action: PayloadAction<{connectedDevices: Record<string, Device>}>,
  ) {
    state.connectedDevices = action.payload.connectedDevices;
  },

  updateWindowInformation(
    state: {windowInformation: WindowInformation},
    action: PayloadAction<{windowInformation: WindowInformation}>,
  ) {
    state.windowInformation = action.payload.windowInformation;
  },

  updateTermsAndConditionsApprove(
    state: {termsAccepted: boolean},
    action: PayloadAction<{termsAccepted: boolean}>,
  ) {
    if (action.payload.termsAccepted) {
      window.localStorage.setItem(TermsAcceptedKey, 'true');
    } else {
      window.localStorage.removeItem(TermsAcceptedKey);
    }
    state.termsAccepted = action.payload.termsAccepted;
  },

  updateAvailable(
    state: {updater: UpdateState | undefined},
    action: PayloadAction<{updateInfo: UpdateInfo}>,
  ) {
    state.updater = {
      ...action.payload.updateInfo,
      downloaded: false,
      progress: null,
      showDialog: false,
    };
  },

  updateDownloaded(state: {updater: UpdateState | undefined}) {
    if (state.updater) {
      state.updater = {...state.updater, downloaded: true, progress: 100};
    } else {
      state.updater = undefined;
    }
  },

  updateDownloadProgress(
    state: {updater: UpdateState | undefined},
    action: PayloadAction<{progress: number}>,
  ) {
    if (state.updater) {
      state.updater = {
        ...state.updater,
        downloaded: false,
        progress: action.payload.progress,
      };
    } else {
      state.updater = undefined;
    }
  },

  updateError(state: {updater: UpdateState | undefined}) {
    if (state.updater) {
      state.updater = {...state.updater, downloaded: false, progress: null};
    } else {
      state.updater = undefined;
    }
  },

  showUpdateReleaseNotes(
    state: {updater: UpdateState | undefined},
    action: PayloadAction<{visible: boolean}>,
  ) {
    if (state.updater) {
      state.updater = {...state.updater, showDialog: action.payload.visible};
    } else {
      state.updater = undefined;
    }
  },

  /** IPC: Send quit_application to main process */
  quitApplication() {},

  /** IPC: Request download of available update */
  downloadUpdate() {},

  /** IPC: Quit the app and install the downloaded update */
  quitAndInstall() {},

  /** IPC: Request connected devices status */
  requestDevicesStatus() {},

  getTelemetryState() {},

  /** IPC: Save telemetry consent state */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  saveTelemetryConsent(
    _state: DeviceState,
    _action: PayloadAction<{consent: boolean}>,
  ) {},

  /** IPC: Mark the telemetry consent notification as shown */
  setTelemetryConsentNotificationShown() {},

  setTelemetryState(
    state: {telemetry: TelemetryConsentState},
    action: PayloadAction<TelemetryConsentState>,
  ) {
    state.telemetry = action.payload;
  },
};
