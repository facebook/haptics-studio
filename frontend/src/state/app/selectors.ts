/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {TelemetryConsentState} from 'main/src/analytics';
import {shallowEqual, useSelector} from 'react-redux';
import {createSelector} from '@reduxjs/toolkit';
import {TermsAcceptedKey} from '../../globals/constants';

import {TutorialEditorState, UpdateState} from '../types';
import {RootState} from '../store';

export const selectAppState = (state: RootState) => state.app;

export const selectOverlays = createSelector([selectAppState], app => ({
  contextMenu: app.contextMenu,
  dialog: app.dialog,
  exportDialog: app.exportDialog,
  showBugReportDialog: app.showBugReportDialog,
  updateDialog: app.updater?.showDialog,
}));

export const selectSnackbarState = (state: RootState) => state.app.snackbar;

export const selectLandingPageSection = (state: RootState) =>
  state.app.landingPageSection;

export const selectVisibility = (state: RootState) => state.app.visibility;

export const selectClipboard = (state: RootState) => state.app.clipboard;

export const selectIsPasting = createSelector(
  [selectClipboard],
  clipboard => clipboard.amplitude.length > 0 || clipboard.frequency.length > 0,
);

export const selectRecentProjects = createSelector([selectAppState], app =>
  app.recentProjects.filter(p => p.error === undefined),
);

export const selectSampleProjects = (state: RootState) =>
  state.app.sampleProjects;

export const selectFocus = (state: RootState) => state.app.focus;

export const selectDefaultControlEnabled = (state: RootState) =>
  state.app.defaultControlEnabled;

export const selectExportDialog = (state: RootState) => state.app.exportDialog;

export const selectLeftPanelWidth = (state: RootState) =>
  state.app.leftPanel.width;

export const selectRightPanelWidth = (state: RootState) =>
  state.app.rightPanel.width;

export const selectTutorialPanelWidth = (state: RootState) =>
  state.app.tutorialPanel.width;

export const selectRightPanelItem = (state: RootState) =>
  state.app.rightPanel.item;

export const selectWSAuthCode = (state: RootState) => state.app.wsAuthCode;

export const selectConnectedDevices = (state: RootState) =>
  state.app.connectedDevices;

export const selectShowDevicePanel = (state: RootState) =>
  state.app.showDevicePanel;

export const selectWindowInformation = (state: RootState) =>
  state.app.windowInformation;

export const selectIsOnWindows = createSelector(
  [selectWindowInformation],
  windowInfo => windowInfo.isOnWindows,
);

export const selectAreTermsAccepted = (_state: RootState) => true; // @oss-enable
// @oss-disable
// @oss-disable
  // @oss-disable
  // @oss-disable

export const selectUpdaterInfo = (state: RootState): UpdateState | undefined =>
  state.app.updater;

export const selectTutorialEditorState = (
  state: RootState,
): TutorialEditorState => state.app.tutorialEditor;

export const selectPointDetail = (
  state: RootState,
): {time: number; value: number} => state.app.pointDetail;

export const selectShouldShowTelemetryConsent = (state: RootState): boolean =>
  state.app.telemetry.shouldShowTelemetryConsentWindow;

export const selectShouldShowTelemetrySettings = (state: RootState): boolean =>
  state.app.telemetrySettingsDialog;

export const selectTelemetryState = (state: RootState): TelemetryConsentState =>
  state.app.telemetry;

export const selectIsAudioPlaying = (state: RootState): boolean =>
  state.app.isAudioPlaying;

export default {
  getAppState() {
    return useSelector(selectAppState, shallowEqual);
  },

  getOverlays() {
    return useSelector(selectOverlays, shallowEqual);
  },

  getSnackbarState() {
    return useSelector(selectSnackbarState, shallowEqual);
  },

  getLandingPageSection() {
    return useSelector(selectLandingPageSection, shallowEqual);
  },

  getVisibility() {
    return useSelector(selectVisibility, shallowEqual);
  },

  getClipboard() {
    return useSelector(selectClipboard, shallowEqual);
  },

  isPasting(): boolean {
    return useSelector(selectIsPasting);
  },

  getRecentProjects() {
    return useSelector(selectRecentProjects, shallowEqual);
  },

  getSampleProjects() {
    return useSelector(selectSampleProjects, shallowEqual);
  },

  getFocus() {
    return useSelector(selectFocus, shallowEqual);
  },

  getDefaultControlStatus(): boolean {
    return useSelector(selectDefaultControlEnabled);
  },

  getExportDialog() {
    return useSelector(selectExportDialog, shallowEqual);
  },

  getSidePanelWidth(side: string): number {
    if (side === 'left') {
      return useSelector(selectLeftPanelWidth);
    } else if (side === 'tutorial') {
      return useSelector(selectTutorialPanelWidth);
    }
    return useSelector(selectRightPanelWidth);
  },

  getRightPanelItem() {
    return useSelector(selectRightPanelItem, shallowEqual);
  },

  getWSAuthCode() {
    return useSelector(selectWSAuthCode, shallowEqual);
  },

  getConnectedDevices() {
    return useSelector(selectConnectedDevices, shallowEqual);
  },

  getDevicePanelState(): boolean {
    return useSelector(selectShowDevicePanel);
  },

  getWindowInformation() {
    return useSelector(selectWindowInformation, shallowEqual);
  },

  isOnWindows(): boolean {
    return useSelector(selectIsOnWindows);
  },

  areTermsAccepted(): boolean {
    return useSelector(selectAreTermsAccepted);
  },

  getUpdaterInfo(): UpdateState | undefined {
    return useSelector(selectUpdaterInfo, shallowEqual);
  },

  getTutorialEditorState(): TutorialEditorState {
    return useSelector(selectTutorialEditorState, shallowEqual);
  },

  getPointDetail(): {time: number; value: number} {
    return useSelector(selectPointDetail, shallowEqual);
  },

  shouldShowTelemetryConsent(): boolean {
    return useSelector(selectShouldShowTelemetryConsent);
  },

  shouldShowTelemetrySettings(): boolean {
    return useSelector(selectShouldShowTelemetrySettings);
  },

  shouldShowTelemetrybanner(): boolean {
    return useSelector(selectShouldShowTelemetryConsent);
  },

  getTelemetryState(): TelemetryConsentState {
    return useSelector(selectTelemetryState);
  },

  isAudioPlaying(): boolean {
    return useSelector(selectIsAudioPlaying);
  },
};
