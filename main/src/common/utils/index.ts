/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Central export file for all utility functions.
 * Re-exports from domain-specific modules for backward compatibility.
 */

// File utilities
export {
  loadJSONFile,
  loadConfigFile,
  saveJSONFile,
  deleteFile,
  isDirEmpty,
} from './file';

// Platform utilities
export {
  IPlatform,
  isOnWindows,
  getCurrentPlatform,
  escapeFilePath,
  getAdbPath,
} from './platform';

// Haptic data utilities
export {
  trimmedHapticData,
  sanitizedEnvelopes,
  sanitizeEnvelopesDuration,
  createEmptyHaptic,
} from './haptic';

// Project utilities
export {
  sanitizeFilename,
  getProjectToOpen,
  getDirectories,
  getAudioFiles,
  isSampleProject,
  isBuiltInTutorial,
  isCustomTutorial,
  isUntitledProject,
  countUntitledProjects,
} from './project';

// Media utilities
export {
  getMediaMetadata,
  verifyAudioFile,
  getFileMimeType,
  getSplitChannels,
} from './media';
export type {MediaMetadata} from './media';

// Export utilities
export type {ExportOptions} from './export';
export {exportMetadataForClip, exportContentWithFormats} from './export';

// Miscellaneous utilities
export {
  currentSeconds,
  developerMessagesEnabled,
  now,
  generateRandomDigits,
  getReleaseChannel,
  getAppVersion,
  isAppUpgradeNeeded,
  semVerFromObject,
  executeMigrations,
} from './misc';
