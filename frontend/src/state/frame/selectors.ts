/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {shallowEqual, useSelector} from 'react-redux';
import {createSelector} from '@reduxjs/toolkit';

import {EditorPointData, EnvelopeType} from '../types';
import {RootState} from '../store';

export const selectFrameState = (state: RootState) => state.frame;

export const selectAmplitudeFrame = (state: RootState): EditorPointData[] =>
  state.frame[EnvelopeType.Amplitude];

export const selectFrequencyFrame = (state: RootState): EditorPointData[] =>
  state.frame[EnvelopeType.Frequency];

export const selectCurrentFrame = (
  state: RootState,
  type: EnvelopeType,
): EditorPointData[] => state.frame[type];

export const selectLastPointsTime = createSelector(
  [selectAmplitudeFrame, selectFrequencyFrame],
  (amplitude, frequency): {amplitude: number; frequency: number} => ({
    amplitude: amplitude.length > 0 ? amplitude[amplitude.length - 1].x : 0,
    frequency: frequency.length > 0 ? frequency[frequency.length - 1].x : 0,
  }),
);

export default {
  getCurrentFrame(type: EnvelopeType): EditorPointData[] {
    return useSelector(
      (state: RootState) => selectCurrentFrame(state, type),
      shallowEqual,
    );
  },

  getLastPointsTime(): {amplitude: number; frequency: number} {
    return useSelector(selectLastPointsTime, shallowEqual);
  },
};
