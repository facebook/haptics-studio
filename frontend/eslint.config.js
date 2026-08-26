/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const path = require('path');
const baseConfig = require('../eslint.config.js');

const restrictedModules = [
  'electron',
  '@electron/remote',
  'fs',
  'path',
  'os',
  'child_process',
];
const restrictedModulePatterns = [
  'electron/*',
  '@electron/remote/*',
  'node:*',
  'fs/*',
  'path/*',
  'os/*',
  'child_process/*',
];
const restrictedModuleMessage =
  'Use the Haptics Studio preload bridge instead.';

module.exports = [
  ...baseConfig,
  {
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        project: path.resolve(__dirname, '../tsconfig.json'),
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      'no-restricted-imports': [
        'error',
        {
          paths: restrictedModules.map(name => ({
            name,
            message: restrictedModuleMessage,
          })),
          patterns: [
            {
              group: restrictedModulePatterns,
              message: restrictedModuleMessage,
            },
          ],
        },
      ],
      'no-restricted-modules': [
        'error',
        {
          paths: restrictedModules.map(name => ({
            name,
            message: restrictedModuleMessage,
          })),
          patterns: restrictedModulePatterns,
        },
      ],
    },
  },
];
