/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-param-reassign */
import {createSlice, isAnyOf} from '@reduxjs/toolkit';

import {ClipboardContent} from 'main/src/hapticsSdk';
import projectSlice from '../project/slice';
import editingToolsSlice from '../editingTools/slice';
import {
  EnvelopeType,
  FocusArea,
  LandingPageSection,
  RightPanelSection,
  SnackbarType,
} from '../types';
import {initialState} from './types';
import {
  uiReducers,
  panelReducers,
  deviceReducers,
  contentReducers,
  uiInitialState,
} from './reducers';

/**
 * App slice for managing global application state.
 *
 * This slice is organized into logical groups:
 * - UI: dialogs, snackbars, context menus, overlays (see reducers/ui.ts)
 * - Panel: sidebar widths, focus, panel states (see reducers/panel.ts)
 * - Device: connected devices, WebSocket (see reducers/device.ts)
 * - Content: recent projects, samples, clipboard (see reducers/content.ts)
 */
const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    // UI reducers - dialogs, snackbars, context menus, overlays
    ...uiReducers,

    // Panel reducers - sidebar widths, focus, panel states
    ...panelReducers,

    // Device reducers - connected devices, WebSocket, telemetry
    ...deviceReducers,

    // Content reducers - recent projects, samples, clipboard
    ...contentReducers,
  },
  extraReducers: builder => {
    builder.addCase(editingToolsSlice.actions.enableTrim, state => {
      return {
        ...state,
        focus: FocusArea.RightPanel,
        rightPanel: {
          ...state.rightPanel,
          item: RightPanelSection.Design,
        },
      };
    });
    builder.addCase(projectSlice.actions.createMarker, state => {
      return {
        ...state,
        focus: FocusArea.RightPanel,
        rightPanel: {
          ...state.rightPanel,
          item: RightPanelSection.Markers,
        },
      };
    });
    builder.addCase(projectSlice.actions.analysisSuccess, (state, action) => {
      return {
        ...state,
        rightPanel: {
          ...state.rightPanel,
          item:
            action.payload.audio && action.payload.audio.path
              ? RightPanelSection.Analysis
              : RightPanelSection.Design,
        },
      };
    });
    builder.addCase(
      projectSlice.actions.openProjectSuccess,
      (state, action) => {
        let landingPageSection = LandingPageSection.Projects;
        if (action.payload.project.isTutorial) {
          landingPageSection = LandingPageSection.Learning;
        } else if (action.payload.project.isSample) {
          landingPageSection = LandingPageSection.Samples;
        }
        return {
          ...state,
          focus: FocusArea.Navigator,
          landingPageSection,
          visibility: {
            ...initialState.visibility,
            envelope: EnvelopeType.Amplitude,
          },
          rightPanel: {
            ...state.rightPanel,
            item:
              action.payload.project.clips.length > 0
                ? RightPanelSection.Analysis
                : RightPanelSection.Design,
          },
        };
      },
    );
    builder.addCase(projectSlice.actions.updateHapticFailure, state => {
      return {
        ...state,
        snackbar: {
          text: undefined,
          textKey: 'error.dataValidationFailed',
          type: SnackbarType.Error,
          autoDismiss: true,
          action: undefined,
        },
      };
    });
    builder.addCase(projectSlice.actions.pastePoints, (state, action) => {
      const content: ClipboardContent = action.payload.clipboard;
      if (content.amplitude.length > 0 || content.frequency.length > 0) {
        return {...state, clipboard: content};
      }
      return {...state, clipboard: {amplitude: [], frequency: []}};
    });
    builder.addCase(editingToolsSlice.actions.enablePen, state => {
      return {
        ...state,
        focus: FocusArea.Plot,
        rightPanel: {
          ...state.rightPanel,
          item: RightPanelSection.Design,
        },
      };
    });
    builder.addCase(projectSlice.actions.closeProject, state => {
      return {
        ...state,
        contextMenu: undefined,
        exportDialog: {...uiInitialState.exportDialog},
        dialog: {...uiInitialState.dialog},
        clipboard: {...initialState.clipboard},
        pointDetail: {...initialState.pointDetail},
        trimming: {...initialState.trimming},
      };
    });
    builder.addCase(projectSlice.actions.setCurrentClip, state => {
      return {
        ...state,
        clipboard: {amplitude: [], frequency: []},
      };
    });
    builder.addCase(projectSlice.actions.projectInfo, (state, action) => {
      if (!action.payload.isAuthoringTutorial)
        return {
          ...state,
          tutorialEditor: {showPreview: false, showSettings: false},
        };
      return state;
    });
    builder.addCase(editingToolsSlice.actions.enableEmphasis, state => {
      state.visibility.envelope = EnvelopeType.Amplitude;
    });
    builder.addCase(
      projectSlice.actions.openProjectFailure,
      (state, action) => {
        return {
          ...state,
          snackbar: {
            text: action.payload.error,
            textKey: undefined,
            type: SnackbarType.Error,
            autoDismiss: true,
            action: undefined,
          },
        };
      },
    );
    builder.addMatcher(
      isAnyOf(
        projectSlice.actions.cancelPaste,
        projectSlice.actions.confirmPaste,
        projectSlice.actions.pastePointsInPlace,
        projectSlice.actions.pasteEmphasisInPlace,
      ),
      state => {
        return {
          ...state,
          clipboard: {
            amplitude: [],
            frequency: [],
          },
        };
      },
    );
    builder.addMatcher(
      isAnyOf(
        projectSlice.actions.createMarker,
        editingToolsSlice.actions.selectMarker,
      ),
      state => {
        return {
          ...state,
          rightPanel: {
            ...state.rightPanel,
            item: RightPanelSection.Markers,
          },
        };
      },
    );
  },
});

export default appSlice;
