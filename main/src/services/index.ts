/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Application Services - Modular services extracted from MainApplication
 *
 * Services:
 * - PathManager: Centralized path resolution
 * - ClipboardService: Clipboard watching and validation
 * - SecondaryWindowManager: About and Licenses window lifecycle
 * - ProtocolHandler: media:// protocol registration
 * - FileAssociationHandler: OS-level file association events
 */

export {default as PathManager} from './PathManager';
export {default as ClipboardService} from './ClipboardService';
export {default as SecondaryWindowManager} from './SecondaryWindowManager';
export {default as ProtocolHandler} from './ProtocolHandler';
export {default as FileAssociationHandler} from './FileAssociationHandler';

// Re-export types
export type {ClipboardCallbacks} from './ClipboardService';
export type {SecondaryWindowManagerCallbacks} from './SecondaryWindowManager';
export type {FileAssociationCallbacks} from './FileAssociationHandler';
