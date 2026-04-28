/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {ClipGroup, Clip} from '../types';

export interface ProjectSelection {
  clips: string[];
  groups: string[];
  lastSelected?: string;
}

export interface ProjectState {
  clips: Record<string, Clip>;
  name: string | undefined;
  description?: string;
  slug?: string;
  category?: string;
  version?: string;
  isOpen: boolean;
  loading: boolean;
  sessionId: string | undefined;
  groups: ClipGroup[];
  selection: ProjectSelection;
  currentClipId: string | undefined;
  isSample: boolean;
  isTutorial: boolean;
  isAuthoringTutorial: boolean;
  isTrimmingCurrentClip: boolean;
}

export const initialState: ProjectState = {
  clips: {},
  name: undefined,
  isOpen: false,
  sessionId: undefined,
  groups: [],
  selection: {
    clips: [],
    groups: [],
  },
  currentClipId: undefined,
  loading: false,
  isSample: false,
  isTutorial: false,
  isAuthoringTutorial: false,
  isTrimmingCurrentClip: false,
};
