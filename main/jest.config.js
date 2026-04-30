/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = {
  rootDir: '..',
  roots: ['main/test'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  setupFiles: ['dotenv/config'],
  setupFilesAfterEnv: ['./main/test/testHelper.ts'],
  moduleNameMapper: {
    '^electron$': '<rootDir>/main/test/mocks/electron.ts',
    '^mixpanel$': '<rootDir>/main/test/mocks/mixpanel.ts',
    '^dgram$': '<rootDir>/main/test/mocks/dgram.ts',
    '^uuid$': '<rootDir>/main/test/mocks/uuid.ts',
    '/logger$': '<rootDir>/main/test/mocks/logger.ts',
    '^TelemetryServiceNative$':
      '<rootDir>/main/test/mocks/TelemetryServiceNative.ts',
    '^HapticsSdkNapi$': `<rootDir>/native/bin/${process.platform === 'win32' ? 'win' : 'mac'}/development/HapticsSDK.node`,
  },
  resetMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['main/src/**/*.ts'],
  coverageDirectory: 'main/test/coverage',
  coverageReporters: ['json-summary', 'lcov', 'text'],
};
