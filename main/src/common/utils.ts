/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Utility functions
 *
 * NOTE: This file re-exports from domain-specific modules in ./utils/ for backward compatibility.
 * For new code, prefer importing directly from the specific module (e.g., './utils/file', './utils/platform').
 */

// Re-export everything from the utils directory
export * from './utils/index';
