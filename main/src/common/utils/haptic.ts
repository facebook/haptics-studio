/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Haptic data manipulation utility functions
 */
import {cloneDeep} from 'lodash';
import {Envelopes, FrequencyBreakpoint, HapticData} from '../../hapticsSdk';
import Constants from '../constants';

/**
 * Returns a trimmed version of the haptic data, the amplitude and frequency values of the last
 * point is a result of a linear interpolation between the last two points.
 * @param data the HapticData object
 * @param trimAt the time value at which the trim will occur
 * @returns a new HapticData object
 */
export function trimmedHapticData(
  data: HapticData,
  trimAt: number,
): HapticData {
  const result = cloneDeep(data);

  let {amplitude} = data.signals.continuous.envelopes;

  if (trimAt <= 0) {
    amplitude = [];
  }

  function linearInterpolationForAxisValue(
    p0: {x: number; y: number},
    p1: {x: number; y: number},
    x: number,
  ): number {
    if (p0.x === p1.x) return 0;
    return (p0.y * (p1.x - x) + p1.y * (x - p0.x)) / (p1.x - p0.x);
  }

  if (amplitude[amplitude.length - 1].time > trimAt) {
    const lastPoint = amplitude.findIndex(point => point.time > trimAt);
    amplitude = amplitude.slice(0, lastPoint + 1);
    const x0 = {
      x: amplitude[lastPoint - 1].time,
      y: amplitude[lastPoint - 1].amplitude,
    };
    const x1 = {
      x: amplitude[lastPoint].time,
      y: amplitude[lastPoint].amplitude,
    };
    amplitude[lastPoint] = {
      time: trimAt,
      amplitude: linearInterpolationForAxisValue(x0, x1, trimAt),
    };
  }

  let frequency: FrequencyBreakpoint[] | undefined;
  if (result.signals.continuous.envelopes.frequency) {
    frequency = data.signals.continuous.envelopes.frequency ?? [];

    if (trimAt <= 0) {
      frequency = [];
    }
    if (frequency[frequency.length - 1].time > trimAt) {
      const lastPoint = frequency.findIndex(point => point.time > trimAt);
      frequency = frequency.slice(0, lastPoint + 1);
      const x0 = {
        x: frequency[lastPoint - 1].time,
        y: frequency[lastPoint - 1].frequency,
      };
      const x1 = {
        x: frequency[lastPoint].time,
        y: frequency[lastPoint].frequency,
      };
      frequency[lastPoint] = {
        time: trimAt,
        frequency: linearInterpolationForAxisValue(x0, x1, trimAt),
      };
    }
  }

  result.signals.continuous.envelopes.amplitude = amplitude;
  result.signals.continuous.envelopes.frequency = frequency;
  return result;
}

/**
 * Returns the sanitized envelope, ensuring that the haptic file passes the SDK validation.
 * @param data The haptic data to sanitize
 * @returns The sanitized haptic data, undefined if the haptic data is not valid
 */
export function sanitizedEnvelopes(data: HapticData): HapticData | undefined {
  /* Since 2.0.0 we no longer visually constrain the amplitude and frequency lengths to match.
   * Before exporting we make sure that both envelopes have the same length, using the
   * same logic used by the SDK: hold the last point value in the shorter envelope
   */
  if (
    !data.signals.continuous.envelopes.frequency ||
    data.signals.continuous.envelopes.amplitude.length === 0 ||
    data.signals.continuous.envelopes.frequency.length === 0 ||
    (data.signals.continuous.envelopes.amplitude.length < 2 &&
      data.signals.continuous.envelopes.frequency.length < 2)
  )
    return undefined;

  const result = cloneDeep(data);
  const {amplitude, frequency = []} = result.signals.continuous.envelopes;

  if (
    amplitude[amplitude.length - 1].time > frequency[frequency.length - 1].time
  ) {
    frequency.push({
      time: amplitude[amplitude.length - 1].time,
      frequency: frequency[frequency.length - 1].frequency,
    });
  } else if (
    frequency[frequency.length - 1].time > amplitude[amplitude.length - 1].time
  ) {
    amplitude.push({
      time: frequency[frequency.length - 1].time,
      amplitude: amplitude[amplitude.length - 1].amplitude,
    });
  }
  return result;
}

/**
 * Sanitize the duration as a temporary fix for the Haptics SDK producing envelopes with different
 * duration
 * NOTE: this is different from `sanitizedEnvelopes`
 * @param envelopes The haptic envelopes
 */
export const sanitizeEnvelopesDuration = (envelopes: Envelopes): void => {
  const {amplitude, frequency} = envelopes;
  const amplitudeLength =
    amplitude.length > 0 ? amplitude[amplitude.length - 1].time : 0;
  const frequencyLength =
    frequency && frequency.length > 0
      ? frequency[frequency.length - 1].time
      : 0;
  const duration = Math.max(amplitudeLength, frequencyLength);
  if (amplitude.length > 0) {
    amplitude[amplitude.length - 1].time = duration;
  }
  if (frequency && frequency.length > 0) {
    frequency[frequency.length - 1].time = duration;
  }
};

/**
 * Create an empty haptic data structure
 * @returns Empty HapticData object
 */
export function createEmptyHaptic(): HapticData {
  return {
    version: Constants.HAPTICS_SDK.FORMAT_VERSION,
    metadata: undefined,
    signals: {
      continuous: {
        envelopes: {
          amplitude: [],
          frequency: [],
        },
      },
    },
  };
}
