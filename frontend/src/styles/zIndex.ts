/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Centralized z-index scale for the application.
 * Each layer is spaced by 100 to leave room for future additions.
 *
 * Layer overview (low → high):
 *   Toolbar     – Editor toolbar, timeline, decorative overlays
 *   Panel       – Left and right side panels
 *   Dialog      – Default/informational dialogs, guidance overlay
 *   Menu        – Context menus, dropdown menus
 *   Popover     – Floating panels (device panel, bug report)
 *   System      – System dialogs (telemetry, external auditioning)
 *   TopLevel    – Blocking modals and toasts (T&C, snackbar)
 */
export const enum ZIndex {
  Toolbar = 100,
  Panel = 200,
  Dialog = 300,
  Menu = 400,
  Popover = 500,
  System = 600,
  TopLevel = 700,
}
