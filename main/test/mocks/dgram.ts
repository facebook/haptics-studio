/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const dgram = {
  callback: {} as Record<string, () => undefined>,
  createSocket: jest.fn().mockReturnValue({
    bind: jest.fn(),
    send: jest.fn(),
    setBroadcast: jest.fn(),
    setMulticastTTL: jest.fn(),
    on: (event: string, callback: () => undefined) => {
      dgram.callback[event] = callback;
    },
  }),
};

export default dgram;
