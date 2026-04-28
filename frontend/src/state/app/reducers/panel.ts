/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {PayloadAction} from '@reduxjs/toolkit';
import Constants from '../../../globals/constants';
import {
  EnvelopeType,
  FocusArea,
  LandingPageSection,
  RightPanelSection,
  TutorialEditorState,
} from '../../types';

export interface PanelState {
  landingPageSection: LandingPageSection;
  rightPanel: {width: number; item?: RightPanelSection};
  leftPanel: {width: number};
  tutorialPanel: {width: number};
  visibility: {
    audio: boolean;
    envelope: EnvelopeType;
  };
  defaultControlEnabled: boolean;
  focus: FocusArea;
  tutorialEditor: TutorialEditorState;
  pointDetail: {
    time: number;
    value: number;
  };
  trimming: {
    enabled: boolean;
    time: number | undefined;
  };
}

export const panelInitialState: PanelState = {
  landingPageSection: LandingPageSection.Projects,
  rightPanel: {
    width: Constants.panels.sidePanelMinWidth,
    item: RightPanelSection.Analysis,
  },
  leftPanel: {width: Constants.panels.sidePanelMinWidth},
  tutorialPanel: {width: Constants.panels.tutorialPanelMinWidth},
  visibility: {
    audio: true,
    envelope: EnvelopeType.Amplitude,
  },
  defaultControlEnabled: false,
  focus: FocusArea.Navigator,
  tutorialEditor: {showPreview: false, showSettings: false},
  pointDetail: {
    time: 0,
    value: 0,
  },
  trimming: {
    enabled: false,
    time: undefined,
  },
};

export const panelReducers = {
  setLandingPageSection(
    state: {landingPageSection: LandingPageSection},
    action: PayloadAction<{section: LandingPageSection}>,
  ) {
    state.landingPageSection = action.payload.section;
  },

  setFocusArea(
    state: {focus: FocusArea},
    action: PayloadAction<{focus: FocusArea}>,
  ) {
    state.focus = action.payload.focus;
  },

  toggleDefaultControls(
    state: {defaultControlEnabled: boolean},
    action: PayloadAction<{enabled: boolean}>,
  ) {
    state.defaultControlEnabled = action.payload.enabled;
  },

  setSidePanelWidth(
    state: {
      tutorialPanel: {width: number};
      leftPanel: {width: number};
      rightPanel: {width: number; item?: RightPanelSection};
    },
    action: PayloadAction<{
      width: number;
      side: 'left' | 'right' | 'tutorial';
    }>,
  ) {
    if (action.payload.side === 'tutorial') {
      state.tutorialPanel = {
        ...state.tutorialPanel,
        width: Math.min(
          Math.max(
            action.payload.width,
            Constants.panels.tutorialPanelMinWidth,
          ),
          Constants.panels.tutorialPanelMaxWidth,
        ),
      };
    } else {
      const width = Math.min(
        Math.max(action.payload.width, Constants.panels.sidePanelMinWidth),
        Constants.panels.sidePanelMaxWidth,
      );
      if (action.payload.side === 'left') {
        state.leftPanel = {...state.leftPanel, width};
      } else {
        state.rightPanel = {...state.rightPanel, width};
      }
    }
  },

  toggleAudioVisibility(state: {visibility: PanelState['visibility']}) {
    state.visibility = {...state.visibility, audio: !state.visibility.audio};
  },

  setSelectedEnvelope(
    state: {visibility: PanelState['visibility']},
    action: PayloadAction<{envelope: EnvelopeType; clipId?: string}>,
  ) {
    state.visibility = {
      ...state.visibility,
      envelope: action.payload.envelope,
    };
  },

  setRightPanelItem(
    state: {rightPanel: PanelState['rightPanel']},
    action: PayloadAction<{item: RightPanelSection | undefined}>,
  ) {
    state.rightPanel = {
      ...state.rightPanel,
      item: action.payload.item ?? RightPanelSection.Analysis,
    };
  },

  showTutorialPreview(
    state: {tutorialEditor: TutorialEditorState},
    action: PayloadAction<{visible: boolean}>,
  ) {
    state.tutorialEditor = {
      ...state.tutorialEditor,
      showPreview: action.payload.visible,
    };
  },

  showTutorialSettings(
    state: {tutorialEditor: TutorialEditorState},
    action: PayloadAction<{visible: boolean}>,
  ) {
    state.tutorialEditor = {
      ...state.tutorialEditor,
      showSettings: action.payload.visible,
    };
  },

  setPointDetail(
    state: {pointDetail: PanelState['pointDetail']},
    action: PayloadAction<{time: number; value: number}>,
  ) {
    state.pointDetail = {
      time: action.payload.time,
      value: action.payload.value,
    };
  },

  /** IPC: Toggle the emphasis menu item state in the application menu */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toggleEmphasisMenu(
    _state: PanelState,
    _action: PayloadAction<{checked: boolean; enabled: boolean}>,
  ) {},

  /** IPC: Toggle the copy menu item state in the application menu */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toggleCopyMenu(
    _state: PanelState,
    _action: PayloadAction<{enabled: boolean}>,
  ) {},
};
