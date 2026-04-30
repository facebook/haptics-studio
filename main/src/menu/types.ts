/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {ProjectMetadata} from '../common/configs';

/**
 * Represents a menu item that can be toggled on or off by the UI.
 * The state is saved and restored when we need to switch between the default menu actions
 * (e.g. the system copy and paste commands) and the specific edit commands.
 */
export enum MenuToggleItem {
  cut = 'cut',
  paste = 'paste',
  paste_in_place = 'paste_in_place',
  paste_emphasis_in_place = 'paste_emphasis_in_place',
  copy = 'copy',
  group = 'group',
  ungroup = 'ungroup',
  add_marker = 'add_marker',
  duplicate_clips = 'duplicate_clips',
  select_all = 'select_all',
}

/**
 * State for menu item toggles
 */
export type MenuToggleState = Partial<Record<MenuToggleItem, boolean>>;

/**
 * Configuration options for building menus
 */
export interface MenuBuildOptions {
  termsAccepted: boolean;
  hasCurrentProject: boolean;
  isCurrentProjectDirty: boolean;
  isTutorial: boolean;
  isAuthoringTutorial: boolean;
  projectName: string;
  isOnWindows: boolean;
  isDevelopment: boolean;
  defaultControls: boolean;
}

/**
 * Callbacks for menu actions
 */
export interface MenuCallbacks {
  // UI communication
  sendToUI: (action: string, message?: object) => void;

  // Window management
  showAboutWindow: () => void;

  // Clipboard operations
  isClipboardValid: () => boolean;
  clipboardContainsEmphasis: () => boolean;
  sendClipboardContent: (action: string) => void;

  // Project operations
  onNewProject: () => Promise<void>;
  onOpenProject: () => Promise<void>;
  onCloseProject: () => Promise<void>;
  onSaveProject: () => Promise<void>;
  onSaveAsProject: () => Promise<void>;
  onLoadProject: (projectFile: string, isDirty: boolean) => Promise<void>;

  // Updater
  onCheckForUpdates: () => void;

  // External links
  openExternal: (url: string) => Promise<void>;

  // App version
  getAppVersion: () => string;

  // Release notes path (for dev mode)
  getReleaseNotesPath?: () => string;
}

/**
 * Data providers for menu building
 */
export interface MenuDataProviders {
  getRecentProjects: () => ProjectMetadata[];
  getSamplesProjects: () => ProjectMetadata[];
  getProjectToOpen: (filePath: string) => {
    projectToOpen: string;
    isDirty: boolean;
  };
  getHelpMenuItems: () => Array<{label: string; url: string}>;
}

/**
 * Menu builder configuration combining all dependencies
 */
export interface MenuBuilderConfig {
  callbacks: MenuCallbacks;
  dataProviders: MenuDataProviders;
  productName: string;
}

/**
 * Menu item with additional metadata for emphasis feature
 */
export interface EmphasisMenuState {
  enabled: boolean;
  checked: boolean;
}

/**
 * Export menu state for saving/restoring
 */
export interface ExportMenuState {
  exportEnabled: boolean;
  exportAllEnabled: boolean;
}
