/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {contextBridge, ipcRenderer, webUtils} from 'electron';
import type {IpcRendererEvent} from 'electron';

import {
  IpcInvokeChannel,
  IpcInvokeChannelName,
  IpcSendChannel,
  IpcSendChannelName,
  MainToRenderer,
  MainToRendererChannelName,
} from '../../shared';
import type {
  HapticsStudioBridge,
  IpcBridgeListener,
} from '../../shared/ipc-bridge';

const allowedInvokeChannels = new Set<string>(Object.values(IpcInvokeChannel));
const allowedSendChannels = new Set<string>(Object.values(IpcSendChannel));
const allowedReceiveChannels = new Set<string>(Object.values(MainToRenderer));

function assertAllowedChannel(
  channels: Set<string>,
  channel: string,
  operation: string,
): void {
  if (!channels.has(channel)) {
    throw new Error(`Disallowed ${operation} IPC channel: ${channel}`);
  }
}

const listenerWrappers = new Map<
  IpcBridgeListener,
  Map<MainToRendererChannelName, (event: IpcRendererEvent, ...args: unknown[]) => void>
>();

function removeListener(
  channel: MainToRendererChannelName,
  listener: IpcBridgeListener,
): void {
  assertAllowedChannel(allowedReceiveChannels, channel, 'receive');
  const channelListeners = listenerWrappers.get(listener);
  const wrappedListener = channelListeners?.get(channel);
  if (!wrappedListener) {
    return;
  }

  ipcRenderer.off(channel, wrappedListener);
  channelListeners?.delete(channel);
  if (channelListeners?.size === 0) {
    listenerWrappers.delete(listener);
  }
}

export const bridge: HapticsStudioBridge = Object.freeze({
  invoke: (channel: IpcInvokeChannelName, payload?: unknown) => {
    assertAllowedChannel(allowedInvokeChannels, channel, 'invoke');
    return ipcRenderer.invoke(channel, payload) as Promise<unknown>;
  },
  send: (channel: IpcSendChannelName, payload?: unknown) => {
    assertAllowedChannel(allowedSendChannels, channel, 'send');
    ipcRenderer.send(channel, payload);
  },
  on: (channel: MainToRendererChannelName, listener: IpcBridgeListener) => {
    assertAllowedChannel(allowedReceiveChannels, channel, 'receive');
    const wrappedListener = (
      _event: IpcRendererEvent,
      ...args: unknown[]
    ): void => listener(...args);
    const channelListeners = listenerWrappers.get(listener) ?? new Map();
    const previousListener = channelListeners.get(channel);
    if (previousListener) {
      ipcRenderer.off(channel, previousListener);
    }
    channelListeners.set(channel, wrappedListener);
    listenerWrappers.set(listener, channelListeners);
    ipcRenderer.on(channel, wrappedListener);
    return () => removeListener(channel, listener);
  },
  off: removeListener,
  removeAllListeners: (channel: MainToRendererChannelName) => {
    assertAllowedChannel(allowedReceiveChannels, channel, 'receive');
    const listeners = Array.from(listenerWrappers.entries());
    listeners.forEach(([listener, channelListeners]) => {
      if (channelListeners.has(channel)) {
        removeListener(channel, listener);
      }
    });
  },
  getPathForFile: (file: unknown) =>
    webUtils.getPathForFile(
      file as Parameters<typeof webUtils.getPathForFile>[0],
    ),
  openExternal: (url: string) => {
    ipcRenderer.send(IpcSendChannel.OpenExternalUrl, {url});
  },
  writeClipboardText: (text: string) => {
    ipcRenderer.send(IpcSendChannel.WriteClipboardText, {text});
  },
});

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('hapticsStudio', bridge);
} else {
  (globalThis as typeof globalThis & {hapticsStudio: HapticsStudioBridge})
    .hapticsStudio = bridge;
}
