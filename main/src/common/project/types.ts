/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Project Types - Shared interfaces for project data structures
 */

import {
  HapticData,
  OfflineAnalysisSettings,
  PreprocessingSettings,
  VisualWaveform,
} from '../../hapticsSdk';
import {ProjectMetadata} from '../configs';

export interface AssetFile {
  path?: string;
  hapticPath?: string;
  channels?: number;
}

export interface OathSettings {
  preprocessing: PreprocessingSettings;
  offline: OfflineAnalysisSettings;
}

export interface ClipMarker {
  id: string;
  name: string;
  time: number;
  isEditing?: boolean;
  isVisible?: boolean;
}

/**
 * Clip details stored in the project
 */
export interface Clip {
  clipId: string;
  name: string;
  audioAsset?: AssetFile;
  waveform: VisualWaveform;
  settings: OathSettings;
  haptic?: HapticData;
  notes?: string;
  markers?: ClipMarker[];
  lastUpdate?: number;
  trimAt?: number;
  playhead?: number;
}

export interface ClipGroup {
  id: string;
  name: string | undefined;
  isFolder: boolean;
  clips: string[];
}

export interface ProjectState {
  clipId: string;
  sessionId: string;
}

// Clip data used during analysis and the IPC
export interface ClipInfo {
  clipId?: string;
  name?: string;
  sessionId?: string;
  audio?: AssetFile & {exists?: boolean};
  svg?: VisualWaveform;
  haptic?: HapticData;
  settings?: OathSettings;
}

export interface ProjectVersion {
  major: number;
  minor: number;
  patch: number;
}

/**
 * Project file structure
 */
export interface ProjectContent {
  isTutorial?: boolean;
  isAuthoringTutorial?: boolean;
  updatedAt?: number;
  version: ProjectVersion;
  metadata: ProjectMetadata;
  state: ProjectState;
  clips: Clip[];
  groups: ClipGroup[];
}

export type ExportableContent = Omit<
  ProjectContent,
  'updatedAt' | 'isTutorial' | 'isAuthoringTutorial'
>;
