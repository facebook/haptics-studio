/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default {
  version: {
    major: 1,
    minor: 0,
    patch: 0,
  },
  metadata: {
    editor: 'mock',
    source: '',
    project: 'test mock',
    tags: [''],
    description: 'Mock data for the test suite',
  },
  signals: {
    continuous: {
      envelopes: {
        amplitude: [
          {
            time: 0.0,
            amplitude: 0.0,
          },
          {
            time: 0.1,
            amplitude: 0.1,
          },
          {
            time: 0.2,
            amplitude: 0.2,
          },
          {
            time: 0.3,
            amplitude: 1.0,
          },
          {
            time: 0.4,
            amplitude: 0.2,
          },
          {
            time: 0.5,
            amplitude: 0.1,
          },
          {
            time: 0.6,
            amplitude: 0.1,
            emphasis: {
              amplitude: 0.5,
              frequency: 0.5,
            },
          },
          {
            time: 0.7,
            amplitude: 0.2,
            emphasis: {
              amplitude: 1.0,
              frequency: 1.0,
            },
          },
          {
            time: 0.8,
            amplitude: 0.4,
          },
          {
            time: 0.9,
            amplitude: 0.4,
          },
        ],
        frequency: [
          {
            time: 0.0,
            frequency: 0.1,
          },
          {
            time: 0.1,
            frequency: 0.2,
          },
          {
            time: 0.2,
            frequency: 0.3,
          },
          {
            time: 0.3,
            frequency: 0.2,
          },
          {
            time: 0.4,
            frequency: 0.1,
          },
          {
            time: 0.5,
            frequency: 0.4,
          },
          {
            time: 0.6,
            frequency: 0.6,
          },
          {
            time: 0.7,
            frequency: 0.8,
          },
          {
            time: 0.8,
            frequency: 0.2,
          },
          {
            time: 0.9,
            frequency: 0.1,
          },
        ],
      },
    },
  },
};
