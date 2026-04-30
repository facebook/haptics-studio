/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {PayloadAction} from '@reduxjs/toolkit';
import {AnyAction} from 'redux';
import {
  ContextMenuPosition,
  SnackbarAction,
  SnackbarType,
  DialogState,
  SnackbarState,
} from '../../types';
import {ExportFormat} from 'main/src/listeners/clips';

export type ExportState = 'success' | 'pending' | 'none';

export interface UIState {
  snackbar: SnackbarState | undefined;
  dialog: DialogState;
  contextMenu: ContextMenuPosition | undefined;
  showBugReportDialog: boolean;
  telemetrySettingsDialog: boolean;
  exportDialog: {
    open: boolean;
    formats: ExportFormat[];
    flatten: boolean;
    packageProject: boolean;
    status: ExportState;
  };
  isAudioPlaying: boolean;
}

export const uiInitialState: UIState = {
  snackbar: undefined,
  dialog: {
    visible: false,
    title: '',
    text: '',
    confirmButton: '',
    action: undefined,
  },
  contextMenu: undefined,
  showBugReportDialog: false,
  telemetrySettingsDialog: false,
  exportDialog: {
    open: false,
    formats: ['haptic'],
    flatten: false,
    packageProject: false,
    status: 'none',
  },
  isAudioPlaying: false,
};

export const uiReducers = {
  showSnackbar(
    state: {snackbar: SnackbarState | undefined},
    action: PayloadAction<{
      text?: string;
      textKey?: string;
      snackbarType: SnackbarType;
      autoDismiss: boolean;
      action?: SnackbarAction;
    }>,
  ) {
    state.snackbar = {
      text: action.payload.text,
      textKey: action.payload.textKey,
      type: action.payload.snackbarType,
      autoDismiss: action.payload.autoDismiss,
      action: action.payload.action,
    };
  },

  dismissSnackbar(state: {snackbar: SnackbarState | undefined}) {
    state.snackbar = undefined;
  },

  showDialog(
    state: {dialog: DialogState},
    action: PayloadAction<{
      title: string;
      text: string;
      confirmButton: string;
      action: AnyAction;
    }>,
  ) {
    state.dialog = {
      visible: true,
      title: action.payload.title,
      text: action.payload.text,
      confirmButton: action.payload.confirmButton,
      action: action.payload.action,
    };
  },

  dismissDialog(state: {dialog: DialogState}) {
    state.dialog = {...uiInitialState.dialog};
  },

  showContextMenu(
    state: {contextMenu: ContextMenuPosition | undefined},
    action: PayloadAction<{position: ContextMenuPosition}>,
  ) {
    state.contextMenu = action.payload.position;
  },

  dismissContextMenu(state: {contextMenu: ContextMenuPosition | undefined}) {
    state.contextMenu = undefined;
  },

  showExportDialog(
    state: {exportDialog: UIState['exportDialog']},
    _action: PayloadAction<{clips: string[]}>,
  ) {
    state.exportDialog.open = true;
    state.exportDialog.status = 'none';
  },

  updateExportDialog(
    state: {exportDialog: UIState['exportDialog']},
    action: PayloadAction<{
      status?: ExportState;
      formats?: ExportFormat[];
      flatten?: boolean;
      packageProject?: boolean;
    }>,
  ) {
    if (action.payload.status) {
      state.exportDialog.status = action.payload.status;
    }
    if (action.payload.formats) {
      state.exportDialog.formats = action.payload.formats;
    }
    if (action.payload.flatten !== undefined) {
      state.exportDialog.flatten = action.payload.flatten;
    }
    if (action.payload.packageProject !== undefined) {
      state.exportDialog.packageProject = action.payload.packageProject;
    }
  },

  dismissExportDialog(state: {exportDialog: UIState['exportDialog']}) {
    state.exportDialog.open = false;
  },

  confirmExport(
    _state: {exportDialog: UIState['exportDialog']},
    _action: PayloadAction<{
      clips: string[];
      formats: string[];
      packageProject: boolean;
      flatten: boolean;
      gain?: number;
      sampleRate?: number;
    }>,
  ) {},

  showBugReportDialog(state: {showBugReportDialog: boolean}) {
    state.showBugReportDialog = true;
  },

  dismissBugReportDialog(state: {showBugReportDialog: boolean}) {
    state.showBugReportDialog = false;
  },

  showTelemetrySettingsDialog(state: {telemetrySettingsDialog: boolean}) {
    state.telemetrySettingsDialog = true;
  },

  dismissTelemetrySettingsDialog(state: {telemetrySettingsDialog: boolean}) {
    state.telemetrySettingsDialog = false;
  },

  setAudioPlaying(
    state: {isAudioPlaying: boolean},
    action: PayloadAction<{isPlaying: boolean}>,
  ) {
    state.isAudioPlaying = action.payload.isPlaying;
  },

  /** IPC: Open the export folder in the system file browser */
  openExportFolder() {},

  /** IPC: Report a frontend error to the main process */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  reportFrontendError(
    _state: UIState,
    _action: PayloadAction<{error: string; componentStack?: string}>,
  ) {},
};
