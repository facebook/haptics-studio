/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Project Module - Re-exports for project-related functionality
 */

// Types
export type {
  AssetFile,
  OathSettings,
  ClipMarker,
  Clip,
  ClipGroup,
  ProjectState,
  ClipInfo,
  ProjectVersion,
  ProjectContent,
  ExportableContent,
} from './types';

// Clip Operations
export {
  getClips,
  getCurrentClip,
  getClipById,
  addOrUpdateClip,
  deleteClip,
  updateClip,
  duplicateClip,
} from './clipOperations';

// Asset Path Utilities
export {
  getDefaultProjectPath,
  setAbsoluteAssetsPaths,
  setRelativeAssetsPath,
} from './assetPathUtils';

// Project Sanitizer
export {
  isProjectVersionCompatible,
  needsSettingsRemapping,
  parseSettings,
  sanitizeProject,
} from './projectSanitizer';
