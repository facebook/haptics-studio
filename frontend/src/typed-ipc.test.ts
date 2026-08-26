/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {describe, expect, it, jest} from '@jest/globals';

import {MainToRenderer} from '../../shared/ipc-channels';
import {mockHapticsStudioBridge} from './__mocks__/hapticsStudioBridge';
import {
  typedOff,
  typedOn,
  typedRemoveAllListeners,
} from '../../shared/typed-ipc';

describe('typed IPC listener wrappers', () => {
  it('tracks the same callback independently across channels', () => {
    const listener = jest.fn();
    typedOn(MainToRenderer.Close, listener);
    typedOn(MainToRenderer.Error, listener);

    typedOff(MainToRenderer.Close, listener);
    typedOff(MainToRenderer.Error, listener);

    expect(mockHapticsStudioBridge.off).toHaveBeenCalledTimes(2);
    expect(mockHapticsStudioBridge.off).toHaveBeenNthCalledWith(
      1,
      MainToRenderer.Close,
      expect.any(Function),
    );
    expect(mockHapticsStudioBridge.off).toHaveBeenNthCalledWith(
      2,
      MainToRenderer.Error,
      expect.any(Function),
    );
  });

  it('forgets local wrappers removed by channel', () => {
    const listener = jest.fn();
    typedOn(MainToRenderer.Close, listener);
    typedRemoveAllListeners(MainToRenderer.Close);
    typedOff(MainToRenderer.Close, listener);

    expect(mockHapticsStudioBridge.removeAllListeners).toHaveBeenCalledWith(
      MainToRenderer.Close,
    );
    expect(mockHapticsStudioBridge.off).not.toHaveBeenCalled();
  });
});
