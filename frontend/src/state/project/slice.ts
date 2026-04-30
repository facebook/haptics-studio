/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {createSlice, original} from '@reduxjs/toolkit';
import Constants from '../../globals/constants';
import {clipDuration} from '../../globals/utils';
import appSlice from '../app/slice';
import editingToolsSlice from '../editingTools/slice';
import {EnvelopeType} from '../types';
import {initialState} from './types';
import {
  analysisReducers,
  projectReducers,
  clipsReducers,
  selectionReducers,
  historyReducers,
  pointsReducers,
  emphasisReducers,
  clipboardReducers,
  timelineReducers,
  markersReducers,
  mediaReducers,
  updatedClipState,
} from './reducers';

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    // Analysis reducers
    ...analysisReducers,

    // Project management reducers
    ...projectReducers,

    // Clips CRUD reducers
    ...clipsReducers,

    // Selection and grouping reducers
    ...selectionReducers,

    // Undo/redo history reducers
    ...historyReducers,

    // Points editing reducers
    ...pointsReducers,

    // Emphasis reducers
    ...emphasisReducers,

    // Clipboard reducers
    ...clipboardReducers,

    // Timeline reducers
    ...timelineReducers,

    // Markers reducers
    ...markersReducers,

    // Media (audio) reducers
    ...mediaReducers,
  },
  extraReducers: builder => {
    builder.addCase(appSlice.actions.setSelectedEnvelope, (state, action) => {
      const clip =
        state.clips[action.payload.clipId ?? state.currentClipId ?? ''];
      if (!clip) return;

      clip.state.present.selectedPoints = [];

      clip.state = updatedClipState(clip, original(clip.state.present));
    });
    builder.addCase(editingToolsSlice.actions.enableTrim, (state, _action) => {
      const clip = state.clips[state.currentClipId ?? ''];
      if (!clip || !clip.timeline) return;
      const currentDuration = clipDuration(clip);
      const center = clip.trimAt ?? currentDuration;
      const timeWindow = clip.timeline.endTime - clip.timeline.startTime;
      clip.timeline.endTime = center + timeWindow / 2;
      clip.timeline.startTime = center - timeWindow / 2;
      clip.timeline.duration = Math.max(clip.timeline.endTime, currentDuration);
    });
    builder.addCase(editingToolsSlice.actions.commitTrim, (state, action) => {
      const clip = state.clips[state.currentClipId ?? ''];
      if (!clip || !clip.timeline || action.payload.time === undefined) return;

      clip.trimAt = action.payload.time;
      const timeWindow = clip.timeline.endTime - clip.timeline.startTime;
      clip.timeline.endTime = action.payload.time;
      clip.timeline.startTime = Math.max(clip.timeline.endTime - timeWindow, 0);
    });
    builder.addCase(editingToolsSlice.actions.revertTrim, state => {
      if (state.currentClipId && state.clips[state.currentClipId]) {
        state.clips[state.currentClipId].trimAt = undefined;
      }
    });
    builder.addCase(editingToolsSlice.actions.enablePen, (state, action) => {
      const clip = state.clips[action.payload.clipId];
      if (!clip || !clip.timeline || !clip.state.present.haptic) return;

      const {amplitude, frequency = []} =
        clip.state.present.haptic.signals.continuous.envelopes;

      if (
        action.payload.envelope === EnvelopeType.Amplitude &&
        amplitude.length < 2
      ) {
        amplitude.shift();
      } else if (
        action.payload.envelope === EnvelopeType.Frequency &&
        frequency.length < 2
      ) {
        frequency.shift();
      }
      clip.state.present.selectedEmphasis = undefined;
    });
    builder.addCase(
      editingToolsSlice.actions.cancelPenEdit,
      (state, _action) => {
        if (!state.currentClipId) return;
        const clip = state.clips[state.currentClipId];
        if (!clip || !clip.state.present.haptic) return;
        const {amplitude, frequency = []} =
          clip.state.present.haptic.signals.continuous.envelopes;

        if (frequency.length === 0 && amplitude.length > 0) {
          clip.state.present.haptic.signals.continuous.envelopes.frequency = [
            {
              time: 0,
              frequency: Constants.editing.defaultConstantEnvelopeValue,
            },
          ];
        } else if (amplitude.length === 0 && frequency.length > 0) {
          clip.state.present.haptic.signals.continuous.envelopes.amplitude = [
            {
              time: 0,
              amplitude: Constants.editing.defaultConstantEnvelopeValue,
            },
          ];
        }
      },
    );
  },
});

export default projectSlice;
