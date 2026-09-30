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

export interface ClipboardWatcher {
  stop: () => void;
}

/**
 * Service for clipboard operations
 */
export default class ClipboardService {
  private watcher: ClipboardWatcher | undefined;
  private callbacks: ClipboardCallbacks;
  private currentText = '';
  private hasReadClipboard = false;

  constructor(callbacks: ClipboardCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Start watching the clipboard for valid haptic content
   */
  public startWatching = async (
    hasCurrentProject: () => boolean,
  ): Promise<void> => {
    this.watcher?.stop();
    const updateClipboard = async (): Promise<void> => {
      try {
        const text = await clipboard.readText();
        if (this.hasReadClipboard && text === this.currentText) {
          return;
        }

        this.currentText = text;
        this.hasReadClipboard = true;
        const pasteEnabled = this.isValid(text) && hasCurrentProject();
        this.callbacks.onTextChange(pasteEnabled);
      } catch (error) {
        const err = error as Error;
        Logger.error(err.message, err.stack);
      }
    };

    await updateClipboard();
    const intervalId = setInterval(() => void updateClipboard(), 1000);
    this.watcher = {
      stop: () => clearInterval(intervalId),
    };
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
  public isValid = (text: string = this.currentText): boolean => {
    try {
      const content = JSON.parse(text) as ClipboardContent;
      return isContentValid(content);
    } catch {
      return false;
    }
  };

  /**
   * Checks if clipboard content contains emphasis breakpoints
   */
  public containsEmphasis = (text: string = this.currentText): boolean => {
    if (!this.isValid(text)) {
      return false;
    }

    const content = JSON.parse(text) as ClipboardContent;
    return content.amplitude.some(breakpoint => {
      return breakpoint.emphasis;
    });
  };

  /**
   * Send clipboard content to the UI
   */
  public sendContent = async (action: string): Promise<void> => {
    let contentToPaste = [];
    try {
      const text = await clipboard.readText();
      contentToPaste = JSON.parse(text) as
        AmplitudeBreakpoint[] | FrequencyBreakpoint[];
      // validate that the clipboard content is an array of breakpoints
      if (this.isValid(text)) {
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
