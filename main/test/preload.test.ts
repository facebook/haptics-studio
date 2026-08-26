/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {ipcRenderer, webUtils} from 'electron';

import {
  IpcInvokeChannel,
  IpcSendChannel,
  MainToRenderer,
} from '../../shared';
import {bridge} from '../src/preload';

describe('preload bridge', () => {
  it('allows registered IPC channels', async () => {
    const invoke = jest
      .spyOn(ipcRenderer, 'invoke')
      .mockResolvedValue({status: 'ok'});
    const send = jest.spyOn(ipcRenderer, 'send').mockImplementation();

    await bridge.invoke(IpcInvokeChannel.RecentProjects);
    bridge.send(IpcSendChannel.QuitApplication);

    expect(invoke).toHaveBeenCalledWith(
      IpcInvokeChannel.RecentProjects,
      undefined,
    );
    expect(send).toHaveBeenCalledWith(
      IpcSendChannel.QuitApplication,
      undefined,
    );
  });

  it('rejects unknown IPC channels', () => {
    expect(() =>
      (bridge.send as (channel: string) => void)('unknown_channel'),
    ).toThrow('Disallowed send IPC channel: unknown_channel');
    expect(() =>
      (bridge.on as (channel: string, listener: () => void) => () => void)(
        'unknown_channel',
        jest.fn(),
      ),
    ).toThrow('Disallowed receive IPC channel: unknown_channel');
  });

  it('removes the wrapped listener during cleanup', () => {
    const on = jest.spyOn(ipcRenderer, 'on');
    const off = jest.spyOn(ipcRenderer, 'off');
    const listener = jest.fn();
    const cleanup = bridge.on(MainToRenderer.Close, listener);
    const wrappedListener = on.mock.calls[0][1];

    cleanup();

    expect(off).toHaveBeenCalledWith(MainToRenderer.Close, wrappedListener);
  });

  it('uses webUtils for dropped file paths', () => {
    const file = {} as File;
    (webUtils.getPathForFile as jest.Mock).mockReturnValue('/tmp/audio.wav');

    expect(bridge.getPathForFile(file)).toBe('/tmp/audio.wav');
    expect(webUtils.getPathForFile).toHaveBeenCalledWith(file);
  });
});
