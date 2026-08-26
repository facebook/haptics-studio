/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {HapticsStudioBridge} from '../../../shared/ipc-bridge';

export const mockHapticsStudioBridge: jest.Mocked<HapticsStudioBridge> = {
  invoke: jest.fn(),
  send: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  removeAllListeners: jest.fn(),
  getPathForFile: jest.fn(),
  openExternal: jest.fn(),
  writeClipboardText: jest.fn(),
};

beforeEach(() => {
  mockHapticsStudioBridge.invoke.mockResolvedValue({
    action: '',
    status: 'ok',
    payload: {},
  });
  mockHapticsStudioBridge.on.mockReturnValue(jest.fn());
  mockHapticsStudioBridge.getPathForFile.mockImplementation(file => {
    const droppedFile = file as File & {path?: string};
    return droppedFile.path ?? droppedFile.name;
  });

  Object.defineProperty(window, 'hapticsStudio', {
    configurable: true,
    value: mockHapticsStudioBridge,
  });
});
