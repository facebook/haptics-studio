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
      description: 'Control data to test copy and paste',
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
              amplitude: 0.2,
            },
            {
              time: 0.2,
              amplitude: 0.2,
            },
            {
              time: 0.3,
              amplitude: 0.5,
            },
            {
              time: 0.4,
              amplitude: 0.5,
            },
            {
              time: 0.5,
              amplitude: 0.5,
            },
            {
              time: 0.6,
              amplitude: 0.7,
            },
            {
              time: 0.7,
              amplitude: 1.0,
            },
            {
              time: 0.8,
              amplitude: 1.0,
            },
            {
              time: 0.9,
              amplitude: 0.5,
            },
            {
              time: 1.0,
              amplitude: 0.5,
            },
          ],
          frequency: [
            {
              time: 0.05,
              frequency: 0.0,
            },
            {
              time: 0.15,
              frequency: 0.2,
            },
            {
              time: 0.25,
              frequency: 0.2,
            },
            {
              time: 0.35,
              frequency: 0.5,
            },
            {
              time: 0.45,
              frequency: 0,
            },
            {
              time: 0.55,
              frequency: 0.5,
            },
            {
              time: 0.65,
              frequency: 0.7,
            },
            {
              time: 0.75,
              frequency: 1.0,
            },
            {
              time: 0.85,
              frequency: 1.0,
            },
            {
              time: 0.95,
              frequency: 0.5,
            },
            {
              time: 1.0,
              frequency: 0.5,
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
        time: 0.1,
        amplitude: 0.2,
      },
      {
        time: 0.2,
        amplitude: 0.2,
      },
      {
        time: 0.3,
        amplitude: 0.5,
      },
      {
        time: 0.4,
        amplitude: 0.5,
      },
      {
        time: 0.5,
        amplitude: 0.5,
      },
      {
        time: 0.6,
        amplitude: 0.7,
      },
      {
        time: 0.7,
        amplitude: 1.0,
      },
      {
        time: 0.8,
        amplitude: 1.0,
      },
      {
        time: 0.9,
        amplitude: 0.5,
      },
      {
        time: 1.0,
        amplitude: 0.5,
      },
    ],
  },
};
