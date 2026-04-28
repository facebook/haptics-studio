/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {PayloadAction} from '@reduxjs/toolkit';
import {
  ClipboardContent,
  MenuItems,
  RecentProject,
  SampleProject,
  SnackbarState,
  SnackbarType,
} from '../../types';

export interface ContentState {
  recentProjects: Array<RecentProject>;
  sampleProjects: Array<SampleProject>;
  clipboard: ClipboardContent;
}

export const contentInitialState: ContentState = {
  recentProjects: [],
  sampleProjects: [],
  clipboard: {
    amplitude: [],
    frequency: [],
  },
};

export const contentReducers = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toggleMenuItems(state: ContentState, action: PayloadAction<MenuItems>) {},

  fetchRecents() {},

  fetchRecentsSuccess(
    state: {recentProjects: ContentState['recentProjects']},
    action: PayloadAction<{recentProjects: RecentProject[]}>,
  ) {
    state.recentProjects = action.payload.recentProjects;
  },

  fetchRecentsFailure(
    state: {snackbar: SnackbarState | undefined},
    action: PayloadAction<{error: string}>,
  ) {
    state.snackbar = {
      text: action.payload.error,
      textKey: undefined,
      type: SnackbarType.Error,
      autoDismiss: true,
      action: undefined,
    };
  },

  loadSamples() {},

  loadSamplesSuccess(
    state: {sampleProjects: ContentState['sampleProjects']},
    action: PayloadAction<{sampleProjects: SampleProject[]}>,
  ) {
    state.sampleProjects = action.payload.sampleProjects;
  },

  loadSamplesFailure(
    state: {snackbar: any},
    action: PayloadAction<{error: string}>,
  ) {
    state.snackbar = {
      text: action.payload.error,
      textKey: undefined,
      type: SnackbarType.Error,
      autoDismiss: true,
      action: undefined,
    };
  },

  /** IPC: Open the system file browser to pick a project folder */
  openProjectFromBrowser() {},

  /** IPC: Send an analytics message to the main process */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sendAnalyticsMessage(
    _state: ContentState,
    _action: PayloadAction<{activity: string; message?: Record<string, unknown>}>,
  ) {},
};
