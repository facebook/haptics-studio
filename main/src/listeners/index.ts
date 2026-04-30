/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import analyticsListeners from './analytics';
import clipsListeners from './clips';
import deviceListeners from './device';
import filesListeners from './files';
import globalsListeners from './globals';
import menuListeners from './menu';
import projectListeners from './project';
import updaterListeners from './updater';
import websocketListeners from './ws';

export type IPCStatus = 'ok' | 'error' | 'canceled' | 'invalid';
export interface IPCMessage<T = Record<string, unknown>> {
  action: string;
  status: IPCStatus;
  payload?: T;
  message?: string;
  clipId?: string;
  reason?: string | undefined;
}

/**
 * Bind IPC messages
 */
export default function (): void {
  analyticsListeners();
  clipsListeners();
  deviceListeners();
  filesListeners();
  globalsListeners();
  menuListeners();
  projectListeners();
  updaterListeners();
  websocketListeners();
}
