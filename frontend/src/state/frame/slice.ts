/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-param-reassign */
import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';
import {limitsFromTimeline} from '../../globals/utils';
import {EditorPointData, EnvelopeType, TimeLineState} from '../types';

export interface FrameState {
  [EnvelopeType.Amplitude]: EditorPointData[];
  [EnvelopeType.Frequency]: EditorPointData[];
}

export const initialState: FrameState = {
  amplitude: [],
  frequency: [],
};

const frameSlice = createSlice({
  name: 'frame',
  initialState,
  reducers: {
    /* Calculate and store the current slice visible in the plot */
    set: {
      reducer(
        state,
        action: PayloadAction<{
          amplitude: EditorPointData[];
          frequency: EditorPointData[];
        }>,
      ) {
        state[EnvelopeType.Amplitude] = action.payload.amplitude;
        state[EnvelopeType.Frequency] = action.payload.frequency;
      },
      prepare: (
        amplitude: EditorPointData[],
        frequency: EditorPointData[],
        timeline: TimeLineState,
        selectedPoints: number[],
      ) => {
        const slicedDataFor = (data: EditorPointData[]) => {
          const limits = limitsFromTimeline(data, timeline);
          // If a set of points is selected and moved off screen, we need to keep track of them, increasing the slice size beyond what's currently visible according to the Brush
          const firstIndex =
            selectedPoints.length > 0 ? selectedPoints[0] : limits.start;
          const lastIndex =
            selectedPoints.length > 0
              ? selectedPoints[selectedPoints.length - 1] + 1
              : limits.end;
          return data.slice(
            Math.min(firstIndex, limits.start),
            Math.max(lastIndex, limits.end),
          );
        };

        return {
          payload: {
            amplitude: slicedDataFor(amplitude),
            frequency: slicedDataFor(frequency),
          },
        };
      },
    },
    /* Update the current slice visible in the plot */
    update(
      state,
      action: PayloadAction<{
        envelopeType: EnvelopeType;
        data: EditorPointData[];
      }>,
    ) {
      state[action.payload.envelopeType] = action.payload.data;
    },
  },
});

export default frameSlice;
