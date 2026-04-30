/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Clip listeners - modular IPC handlers for clip operations
 *
 * This module is organized into domain-specific handlers:
 * - clipExport: Export-related operations (export, preview, external auditioning)
 * - clipImport: Import-related operations (audio analysis, haptic import)
 * - clipCrud: CRUD operations (create, delete, update, duplicate)
 * - clipAudio: Audio-related operations (stereo split, haptic update, relocate)
 */

import bindExportHandlers from './clipExport';
import bindImportHandlers from './clipImport';
import bindCrudHandlers from './clipCrud';
import bindAudioHandlers from './clipAudio';

// Re-export all types for external use
export type {
  ExportPreviewMessage,
  ExportFormat,
  ExportMessage,
  ImportHapticMessage,
  ImportHapticPayload,
  AudioAnalysisMessage,
  RetryAudioAnalysisMessage,
  AudioAnalysisUpdateMessage,
  AudioAnalysisFile,
  StereoSplitMessage,
  StereoSplitChannel,
  HapticUpdateMessage,
  CreateEmptyClipMessage,
  ExternalAuditioningMessage,
} from './types';

/**
 * Bind all clip-related IPC handlers
 */
export default function bindClipListeners(): void {
  bindExportHandlers();
  bindImportHandlers();
  bindCrudHandlers();
  bindAudioHandlers();
}
