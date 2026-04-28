/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default {
  haptic: {
    version: {
      major: 1,
      minor: 0,
      patch: 0,
    },
    metadata: {
      editor: 'mock',
      author: 'James Mockerton',
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
              frequency: 0.40550724,
            },
            {
              time: 0.1,
              frequency: 0.37664557,
            },
            {
              time: 0.2,
              frequency: 0.08327816,
            },
            {
              time: 0.3,
              frequency: 0.03425022,
            },
            {
              time: 0.4,
              frequency: 0.023870975,
            },
            {
              time: 0.5,
              frequency: 0.05405904,
            },
            {
              time: 0.6,
              frequency: 0.11555411,
            },
            {
              time: 0.7,
              frequency: 0.068451345,
            },
            {
              time: 0.8,
              frequency: 0.09873606,
            },
            {
              time: 0.9,
              frequency: 0.15905622,
            },
          ],
        },
      },
    },
  },
  svg: {
    envelope: [
      {
        time: 0.0,
        amplitude: 0.0,
      },
      {
        time: 0.0009070295,
        amplitude: 0.06465301,
      },
      {
        time: 0.0013605442,
        amplitude: 0.9032796,
      },
      {
        time: 0.0031746032,
        amplitude: 1.0091883,
      },
      {
        time: 0.017687075,
        amplitude: 0.7304284,
      },
      {
        time: 0.037641723,
        amplitude: 0.4614936,
      },
      {
        time: 0.04988662,
        amplitude: 0.3600025,
      },
      {
        time: 0.06893424,
        amplitude: 0.2569921,
      },
      {
        time: 0.07210884,
        amplitude: 0.26637807,
      },
      {
        time: 0.08979592,
        amplitude: 0.18072033,
      },
    ],
  },
};
