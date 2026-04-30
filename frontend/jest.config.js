/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = {
  preset: 'ts-jest',
  // The root of your source code, typically /src
  // `<rootDir>` is a token Jest substitutes
  rootDir: '..',
  roots: ['frontend/src'],

  // Jest transformations -- this adds support for TypeScript
  // using ts-jest
  transform: {
    '^.+\\.(ts|tsx)?$': 'ts-jest',
    'node_modules/(react-dnd|dnd-core|@react-dnd|react-dnd-html5-backend|react-dnd-test-utils|react-dnd-test-backend|@minoru/react-dnd-treeview|react-dnd-touch-backend)/.+\\.(j|t)sx?$':
      'ts-jest',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff)$':
      '<rootDir>/frontend/fileTransformer.js',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!react-dnd|dnd-core|@react-dnd|react-dnd-html5-backend|react-dnd-test-utils|react-dnd-test-backend|@minoru/react-dnd-treeview|react-dnd-touch-backend)',
  ],

  testEnvironment: 'jsdom',

  // Runs special logic, such as cleaning up components
  // when using React Testing Library and adds special
  // extended assertions to Jest
  setupFilesAfterEnv: [
    '@testing-library/jest-dom/extend-expect',
    'jest-canvas-mock',
  ],

  // Test spec file resolution pattern
  // Matches parent folder `__tests__` and filename
  // should contain `test` or `spec`.
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',

  // Module file extensions for importing
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  moduleNameMapper: {
    '^.+\\.(css|scss)$': '<rootDir>/frontend/src/__mocks__/cssStub.ts',
    '\\.mp4': '<rootDir>/frontend/src/__mocks__/fileMock.ts',
    '^konva': 'konva/konva',
    '^react-konva-utils':
      '<rootDir>/frontend/src/__mocks__/react-konva-utils.tsx',
    '^uuid$': '<rootDir>/main/test/mocks/uuid.ts',
    '^electron$': '<rootDir>/main/test/mocks/electron.ts',
    '^TelemetryServiceNative$':
      '<rootDir>/main/test/mocks/TelemetryServiceNative.ts',
    '^HapticsSdkNapi$': `<rootDir>/native/bin/${process.platform === 'win32' ? 'win' : 'mac'}/development/HapticsSDK.node`,
  },
  resetMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['frontend/src/**/*.{ts,tsx}'],
  coveragePathIgnorePatterns: ['frontend/src/index.ts'],
  coverageDirectory: 'frontend/coverage',
  coverageReporters: ['json-summary', 'lcov', 'text'],
};
