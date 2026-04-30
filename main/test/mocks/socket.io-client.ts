/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

const ioMock = {
  callback: {} as Record<string, () => undefined>,
  connect: jest.fn(),
  close: jest.fn(),
  emit: jest.fn(),
  on: (event: string, callback: () => undefined) => {
    ioMock.callback[event] = callback;
  },
  removeAllListeners: jest.fn(),
  connected: true,
  id: 'socket.io-client-mock',
};
const io = () => {
  jest.spyOn(ioMock, 'connect').mockImplementation(() => {
    if (ioMock.callback.connect) {
      ioMock.callback.connect();
    }
  });
  return ioMock;
};

export {io};
