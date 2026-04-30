/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {ipcRenderer} from 'electron';
import type {IpcRendererEvent} from 'electron';
import type {IpcInvokeChannelName, IpcSendChannelName, MainToRendererChannelName} from './ipc-channels';
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
  if (!ipcRenderer) {
    return Promise.reject(new Error(`ipcRenderer is not available (channel: ${channel})`));
  }
  const [payload] = args;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return ipcRenderer.invoke(channel, payload) as any;
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
  if (!ipcRenderer) {
    return;
  }
  const [payload] = args;
  ipcRenderer.send(channel, payload);
}

// ---------------------------------------------------------------------------
// typedOn / typedOff — main → renderer event listeners
// ---------------------------------------------------------------------------

type MainToRendererCallback = (event: IpcRendererEvent, ...args: unknown[]) => void;

/**
 * Registers a listener for events pushed from the main process.
 *
 * Returns a cleanup function you can call in a useEffect teardown:
 *
 *   useEffect(() => {
 *     const off = typedOn(MainToRenderer.Close, handler);
 *     return off;
 *   }, []);
 */
export function typedOn(
  channel: MainToRendererChannelName,
  listener: MainToRendererCallback,
): () => void {
  if (!ipcRenderer) {
    return () => {};
  }
  ipcRenderer.on(channel, listener);
  return () => {
    ipcRenderer.off(channel, listener);
  };
}

/**
 * Removes a previously registered listener.
 */
export function typedOff(
  channel: MainToRendererChannelName,
  listener: MainToRendererCallback,
): void {
  if (!ipcRenderer) {
    return;
  }
  ipcRenderer.off(channel, listener);
}

/**
 * Removes all listeners for a given channel.
 * Use sparingly — prefer targeted typedOff.
 */
export function typedRemoveAllListeners(
  channel: MainToRendererChannelName,
): void {
  if (!ipcRenderer) {
    return;
  }
  ipcRenderer.removeAllListeners(channel);
}
