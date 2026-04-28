/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

const loggerMock = {
  init: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  silly: jest.fn(),
  logError: jest.fn(),
};

const logger = () => {
  return loggerMock;
};

export default class Logger {
  static get = logger;

  static init(): void {}

  static debug(message: any, ...meta: any): void {
    Logger.overrideLog(message, ...meta);
  }

  static warn(message: any, ...meta: any): void {
    Logger.overrideLog(message, ...meta);
  }

  static error(message: any, ...meta: any): void {
    Logger.overrideLog(message, ...meta);
  }

  static info(message: any, ...meta: any): void {
    Logger.overrideLog(message, ...meta);
  }

  static silly(message: any, ...meta: any): void {
    Logger.overrideLog(message, ...meta);
  }

  static logError(message: any, ...meta: any): void {
    Logger.overrideLog(message, ...meta);
  }

  static overrideLog(message: any, ...meta: any): void {
    if (process.env.TEST_LOGS === '1') {
      // eslint-disable-next-line no-console
      console.log(message, ...meta);
    }
  }
}
