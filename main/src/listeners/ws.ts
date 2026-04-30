/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {IpcInvokeChannel} from '../../../shared';
import {createIPCHandler} from './ipcHandlerUtils';
import WSServer from '../wsServer';

export interface SetPlayheadMessage {
  clipId: string;
  playhead: number;
}

export interface ProjectSyncMessage {
  payload: {
    status: string;
  };
}

/**
 * Sends the playhead to the HMD
 */
function setPlayhead(): void {
  createIPCHandler<SetPlayheadMessage>(IpcInvokeChannel.SetPlayhead, args => {
    WSServer.instance.sendToRoom('set_playhead', {playhead: args.playhead});
  });
}

/**
 * Bind IPC messages
 */
export default function (): void {
  setPlayhead();
}
