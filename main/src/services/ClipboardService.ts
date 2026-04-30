/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * ClipboardService - Manages clipboard watching and validation
 *
 * Handles:
 * - Watching clipboard for valid haptic content
 * - Validating clipboard content format
 * - Detecting emphasis in clipboard content
 * - Sending clipboard content to UI
 */

import {clipboard} from 'electron';
import clipboardWatcher, {ClipboardWatcher} from 'electron-clipboard-watcher';
import {
  AmplitudeBreakpoint,
  FrequencyBreakpoint,
  ClipboardContent,
  isContentValid,
} from '../hapticsSdk';
import Logger from '../common/logger';

export interface ClipboardCallbacks {
  onTextChange: (pasteEnabled: boolean) => void;
  sendToUI: (action: string, message: any) => void;
}

/**
 * Service for clipboard operations
 */
export default class ClipboardService {
  private watcher: ClipboardWatcher | undefined;
  private callbacks: ClipboardCallbacks;

  constructor(callbacks: ClipboardCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Start watching the clipboard for valid haptic content
   */
  public startWatching = (hasCurrentProject: () => boolean): void => {
    this.watcher = clipboardWatcher({
      // delay in ms between polls
      watchDelay: 1000,
      // handler for when text data is copied into the clipboard
      onTextChange: (text: string) => {
        const pasteEnabled = this.isValid(text) && hasCurrentProject();
        this.callbacks.onTextChange(pasteEnabled);
      },
    });
  };

  /**
   * Stop watching the clipboard
   */
  public stopWatching = (): void => {
    this.watcher?.stop();
    this.watcher = undefined;
  };

  /**
   * Get the current watcher instance
   */
  public getWatcher = (): ClipboardWatcher | undefined => {
    return this.watcher;
  };

  /**
   * Checks if clipboard content is valid haptic data
   */
  public isValid = (text?: string): boolean => {
    try {
      const content = JSON.parse(
        text || clipboard.readText(),
      ) as ClipboardContent;
      return isContentValid(content);
    } catch {
      return false;
    }
  };

  /**
   * Checks if clipboard content contains emphasis breakpoints
   */
  public containsEmphasis = (text?: string): boolean => {
    if (!this.isValid(text)) {
      return false;
    }

    const content = JSON.parse(
      text || clipboard.readText(),
    ) as ClipboardContent;
    return content.amplitude.some(breakpoint => {
      return breakpoint.emphasis;
    });
  };

  /**
   * Send clipboard content to the UI
   */
  public sendContent = (action: string): void => {
    let contentToPaste = [];
    try {
      contentToPaste = JSON.parse(clipboard.readText()) as
        | AmplitudeBreakpoint[]
        | FrequencyBreakpoint[];
      // validate that the clipboard content is an array of breakpoints
      if (this.isValid()) {
        this.callbacks.sendToUI(action, {
          action,
          status: 'ok',
          payload: contentToPaste,
        });
      } else {
        throw new Error('Invalid clipboard content');
      }
    } catch (error) {
      const err = error as Error;
      Logger.error(err.message, err.stack);
      this.callbacks.sendToUI(action, {
        action,
        status: 'error',
        message: (error as Error).message,
      });
    }
  };
}
