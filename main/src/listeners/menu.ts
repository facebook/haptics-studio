/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {clipboard, Menu} from 'electron';
import {IpcInvokeChannel, IpcSendChannel} from '../../../shared';
import {createIPCHandler, createIPCListener} from './ipcHandlerUtils';
import MainApplication from '../application';
import Logger from '../common/logger';
import {ClipboardContent, isContentValid} from '../hapticsSdk';

export interface EmphasisMessage {
  checked?: boolean;
  enabled?: boolean;
}

export interface CopyMessage {
  payload: ClipboardContent;
}

function toggleEmphasis(): void {
  createIPCHandler<EmphasisMessage>(IpcInvokeChannel.ToggleEmphasis, args => {
    const {enabled, checked} = args;
    const menu = MainApplication.instance.getApplicationMenu();
    if (menu) {
      const item = menu.getMenuItemById('emphasis');
      if (item) {
        if (checked !== undefined) {
          item.checked = checked;
        }
        if (enabled !== undefined) {
          item.enabled = enabled;
        }
      }
      Menu.setApplicationMenu(menu);
    }
  });
}

function toggleCopy(): void {
  createIPCHandler<{enabled: boolean}>(IpcInvokeChannel.ToggleCopy, args => {
    MainApplication.instance.toggleMenuItems({
      copy: args.enabled,
      cut: args.enabled,
    });
  });
}

function toggleMenuItems(): void {
  createIPCHandler<{[id: string]: boolean}>(IpcInvokeChannel.ToggleMenuItems, args => {
    MainApplication.instance.toggleMenuItems(args);
  });
}

/**
 * Handle copy action - write content from UI to clipboard as JSON
 */
function handleCopy(): void {
  createIPCHandler<CopyMessage>(IpcInvokeChannel.Copy, args => {
    Logger.silly('Content copied to clipboard', args.payload);
    clipboard.writeText(JSON.stringify(args.payload));
    const pasteEnabled = isContentValid(args.payload);
    MainApplication.instance.toggleMenuItems({
      paste: pasteEnabled,
      paste_in_place: pasteEnabled,
    });
  });
}

/**
 * Handle paste action (only on Windows) - send clipboard content to UI
 */
function handlePaste(): void {
  createIPCListener<void>(IpcSendChannel.Paste, () => {
    MainApplication.instance.sendClipboardContent('paste');
  });
}

/**
 * Toggles the behavior of cut, copy and paste items
 */
function toggleDefaultControls(): void {
  createIPCHandler<{enabled: boolean}>(IpcInvokeChannel.ToggleDefaultControls, args => {
    MainApplication.instance.defaultControls = args.enabled === true;
    MainApplication.instance.reloadMenuItems();
  });
}

/**
 * Bind IPC messages
 */
export default function (): void {
  toggleEmphasis();
  handleCopy();
  handlePaste();
  toggleCopy();
  toggleMenuItems();
  toggleDefaultControls();
}
