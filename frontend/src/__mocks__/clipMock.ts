/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  AmplitudeBreakpoint,
  FrequencyBreakpoint,
} from '../../../main/src/hapticsSdk';
import editorDataMock from './editorDataMock';
import {Clip, ClipState, EditorPointData} from '../state/types';
import {defaultDspSettings} from '../state/dsp';

const baseClipState = (options: {
  name?: string;
  selectedPoints?: number[];
  fromAudio?: boolean;
  audioExists?: boolean;
  channels?: number;
  amplitudeBreakpoints?: AmplitudeBreakpoint[];
  frequencyBreakpoints?: FrequencyBreakpoint[];
}): Clip => {
  const {
    name = 'Clip Name',
    selectedPoints = [],
    audioExists = true,
    fromAudio = true,
    channels = 1,
    amplitudeBreakpoints,
    frequencyBreakpoints,
  } = options;

  const audio = {
    path: fromAudio ? '/path/to/clip.wav' : undefined,
    exists: audioExists,
    channels,
  };

  const haptic = amplitudeBreakpoints
    ? {
        version: '',
        signals: {
          continuous: {
            envelopes: {
              amplitude: amplitudeBreakpoints,
              frequency: frequencyBreakpoints,
            },
          },
        },
      }
    : editorDataMock.haptic;

  return {
    name,
    audio,
    svg: editorDataMock.svg,
    video: undefined,
    notes: '',
    playhead: 0,
    loading: false,
    failed: false,
    error: undefined,
    hasChanges: {
      amplitude: false,
      frequency: false,
    },
    timeline: {
      duration: 10,
      startTime: 0,
      endTime: 10,
    },
    state: {
      present: {
        revision: 0,
        dsp: defaultDspSettings(),
        haptic,
        selectedPoints,
      },
      past: [] as Array<ClipState>,
      future: [] as Array<ClipState>,
    },
  } as Clip;
};

export const frameState: EditorPointData[] = [
  {x: 0, y: 0.5, index: 0, emphasis: undefined},
  {x: 0.1, y: 0.7, index: 1, emphasis: {y: 0.9, frequency: 0.5}},
  {x: 0.2, y: 0.5, index: 2, emphasis: undefined},
];

export default baseClipState;
