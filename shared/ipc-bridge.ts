/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {
  IpcInvokeChannelName,
  IpcSendChannelName,
  MainToRendererChannelName,
} from './ipc-channels';

export type IpcBridgeListener = (...args: unknown[]) => void;

export interface HapticsStudioBridge {
  invoke(
    channel: IpcInvokeChannelName,
    payload?: unknown,
  ): Promise<unknown>;
  send(channel: IpcSendChannelName, payload?: unknown): void;
  on(
    channel: MainToRendererChannelName,
    listener: IpcBridgeListener,
  ): () => void;
  off(channel: MainToRendererChannelName, listener: IpcBridgeListener): void;
  removeAllListeners(channel: MainToRendererChannelName): void;
  getPathForFile(file: unknown): string;
  openExternal(url: string): void;
  writeClipboardText(text: string): void;
}

declare global {
  interface Window {
    hapticsStudio: HapticsStudioBridge;
  }
}
