/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {HapticData} from '../../../../main/src/hapticsSdk';

import {Clip, EditorPointData} from '../../state/types';
import Constants, {
  DefaultEmptyClipDuration,
  DefaultMinimumClipDuration,
} from '../constants';

/**
 * Retrieve the timeline info from the haptic data. Returns a default duration if the haptic envelopes are empty
 * @param haptic the haptic data
 * @returns number of samples, duration, and starting and ending time of the timeline
 */
export const timelineFor = (
  haptic: HapticData,
): {samples: number; duration: number; startTime: number; endTime: number} => {
  const {amplitude, frequency} = haptic.signals.continuous.envelopes;
  if (amplitude.length < 2 && (frequency?.length ?? 0) < 2) {
    return {
      samples: 0,
      duration: DefaultEmptyClipDuration,
      startTime: 0,
      endTime: DefaultEmptyClipDuration,
    };
  }
  const samples = Math.max(amplitude.length, frequency?.length || 0);
  const maxDuration = Math.max(
    amplitude[amplitude.length - 1].time,
    frequency?.[frequency.length - 1]?.time || 0,
  );
  const duration = Math.max(maxDuration, DefaultMinimumClipDuration);
  const startingWindow = Math.min(
    samples,
    Constants.timeline.startingWindowSamples,
  );
  const durationPerSample = duration / samples;
  const endTime = durationPerSample * startingWindow;

  return {
    samples,
    duration,
    startTime: 0,
    endTime,
  };
};

/**
 * Get the clip duration from the haptic clip, considering the longest envelope between amplitude and frequency
 * @param clip The clip
 * @returns The clip duration or 0 if the clip doesn't have a haptic signal
 */
export const clipDuration = (clip: Clip): number => {
  if (!clip || !clip.state.present.haptic) return 0;
  const {amplitude, frequency = []} =
    clip.state.present.haptic.signals.continuous.envelopes;
  let lastAmplitudeTime = 0;
  if (amplitude.length > 0) {
    lastAmplitudeTime = amplitude[amplitude.length - 1].time;
  }
  let lastFrequencyTime = 0;
  if (frequency.length > 0) {
    lastFrequencyTime = frequency[frequency.length - 1].time;
  }
  return Math.max(lastAmplitudeTime, lastFrequencyTime);
};

/**
 * Prepare the data for the editor from the haptic clip
 * @param haptic The haptic clip
 * @returns The `EditorPointData` for the amplitude and frequency
 */
export const editorDataFromHaptic = (
  haptic: HapticData | undefined,
): {amplitude: EditorPointData[]; frequency: EditorPointData[]} => {
  if (!haptic) return {amplitude: [], frequency: []};

  const amplitude = haptic.signals.continuous.envelopes.amplitude.map(
    (a, idx) => {
      return {
        x: a.time,
        y: a.amplitude,
        index: idx,
        emphasis: a.emphasis
          ? {
              y: a.emphasis.amplitude,
              frequency: a.emphasis.frequency,
            }
          : undefined,
      };
    },
  );
  const frequency = (haptic.signals.continuous.envelopes.frequency ?? []).map(
    (i, idx) => {
      return {x: i.time, y: i.frequency, index: idx};
    },
  );
  return {amplitude, frequency};
};
