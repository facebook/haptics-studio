/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const path = require('path');

module.exports = [
  {
    ignores: ['**/webpack.*.js', '**/node_modules/**', '**/dist/**'],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        project: path.resolve(__dirname, './tsconfig.json'),
        sourceType: 'module',
        ecmaVersion: 'latest',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      react: require('eslint-plugin-react'),
      import: require('eslint-plugin-import'),
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      'no-console': ['warn', {allow: ['warn', 'error']}],
      'no-unused-vars': 'off',
      'prefer-const': 'error',
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react/prop-types': 'off',
      'import/no-unresolved': 'off',
      'import/extensions': 'off',
      // Disable formatting rules that conflict with Prettier
      'object-curly-spacing': 'off',
      'operator-linebreak': 'off',
      indent: 'off',
      'react/jsx-closing-bracket-location': 'off',
      'arrow-parens': 'off',
      'comma-dangle': 'off',
      quotes: 'off',
      semi: 'off',
      'max-len': 'off',
      'brace-style': 'off',
      'comma-spacing': 'off',
      'func-call-spacing': 'off',
      'key-spacing': 'off',
      'keyword-spacing': 'off',
      'space-before-blocks': 'off',
      'space-before-function-paren': 'off',
      'space-infix-ops': 'off',
      '@typescript-eslint/indent': 'off',
      '@typescript-eslint/brace-style': 'off',
      '@typescript-eslint/comma-dangle': 'off',
      '@typescript-eslint/comma-spacing': 'off',
      '@typescript-eslint/func-call-spacing': 'off',
      '@typescript-eslint/keyword-spacing': 'off',
      '@typescript-eslint/member-delimiter-style': 'off',
      '@typescript-eslint/semi': 'off',
      '@typescript-eslint/space-before-blocks': 'off',
      '@typescript-eslint/space-before-function-paren': 'off',
      '@typescript-eslint/space-infix-ops': 'off',
      '@typescript-eslint/type-annotation-spacing': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
