/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {IpcRendererEvent} from 'electron';
import type {
  IpcInvokeChannelName,
  IpcSendChannelName,
  MainToRendererChannelName,
} from './ipc-channels';
import type {IpcBridgeListener} from './ipc-bridge';
import type {IpcInvokeMap, IpcSendMap, IPCResponse} from './ipc-types';

// ---------------------------------------------------------------------------
// typedInvoke — renderer → main (request / response)
// ---------------------------------------------------------------------------

/**
 * Sends an invoke-style IPC message and returns the typed response.
 *
 * Channels whose request type is `void` don't require a payload argument.
 * The overloads below enforce this at the call site.
 */
export function typedInvoke<C extends IpcInvokeChannelName>(
  channel: C,
  ...args: C extends keyof IpcInvokeMap
    ? IpcInvokeMap[C]['request'] extends void
      ? []
      : [payload: IpcInvokeMap[C]['request']]
    : [payload?: unknown]
): Promise<
  C extends keyof IpcInvokeMap
    ? IPCResponse<IpcInvokeMap[C]['response']>
    : unknown
> {
  const [payload] = args;
  return window.hapticsStudio.invoke(channel, payload) as Promise<
    C extends keyof IpcInvokeMap
      ? IPCResponse<IpcInvokeMap[C]['response']>
      : unknown
  >;
}

// ---------------------------------------------------------------------------
// typedSend — renderer → main (fire-and-forget)
// ---------------------------------------------------------------------------

/**
 * Sends a fire-and-forget IPC message with a typed payload.
 *
 * Channels whose payload type is `void` don't require a second argument.
 */
export function typedSend<C extends IpcSendChannelName>(
  channel: C,
  ...args: C extends keyof IpcSendMap
    ? IpcSendMap[C] extends void
      ? []
      : [payload: IpcSendMap[C]]
    : [payload?: unknown]
): void {
  const [payload] = args;
  window.hapticsStudio.send(channel, payload);
}

// ---------------------------------------------------------------------------
// typedOn / typedOff — main → renderer event listeners
// ---------------------------------------------------------------------------

type MainToRendererCallback = (
  event: IpcRendererEvent,
  ...args: unknown[]
) => void;

const listenerWrappers = new Map<
  MainToRendererCallback,
  Map<MainToRendererChannelName, IpcBridgeListener>
>();

function getListenerWrapper(
  channel: MainToRendererChannelName,
  listener: MainToRendererCallback,
): IpcBridgeListener {
  const channelListeners = listenerWrappers.get(listener) ?? new Map();
  const existing = channelListeners.get(channel);
  if (existing) {
    return existing;
  }

  const wrapper: IpcBridgeListener = (...args) =>
    listener({} as IpcRendererEvent, ...args);
  channelListeners.set(channel, wrapper);
  listenerWrappers.set(listener, channelListeners);
  return wrapper;
}

function forgetListenerWrapper(
  channel: MainToRendererChannelName,
  listener: MainToRendererCallback,
): void {
  const channelListeners = listenerWrappers.get(listener);
  channelListeners?.delete(channel);
  if (channelListeners?.size === 0) {
    listenerWrappers.delete(listener);
  }
}

/**
 * Registers a listener for events pushed from the main process.
 *
 * Returns a cleanup function you can call in a useEffect teardown.
 */
export function typedOn(
  channel: MainToRendererChannelName,
  listener: MainToRendererCallback,
): () => void {
  const wrapper = getListenerWrapper(channel, listener);
  const cleanup = window.hapticsStudio.on(channel, wrapper);
  return () => {
    cleanup();
    forgetListenerWrapper(channel, listener);
  };
}

/**
 * Removes a previously registered listener.
 */
export function typedOff(
  channel: MainToRendererChannelName,
  listener: MainToRendererCallback,
): void {
  const wrapper = listenerWrappers.get(listener)?.get(channel);
  if (!wrapper) {
    return;
  }
  window.hapticsStudio.off(channel, wrapper);
  forgetListenerWrapper(channel, listener);
}

/**
 * Removes all listeners for a given channel.
 * Use sparingly — prefer targeted typedOff.
 */
export function typedRemoveAllListeners(
  channel: MainToRendererChannelName,
): void {
  window.hapticsStudio.removeAllListeners(channel);
  listenerWrappers.forEach((channelListeners, listener) => {
    if (channelListeners.has(channel)) {
      forgetListenerWrapper(channel, listener);
    }
  });
}

export function getPathForFile(file: File): string {
  return window.hapticsStudio.getPathForFile(file);
}

export function openExternal(url: string): void {
  window.hapticsStudio.openExternal(url);
}

export function writeClipboardText(text: string): void {
  window.hapticsStudio.writeClipboardText(text);
}
