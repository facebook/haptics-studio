/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {createSlice, isAnyOf, PayloadAction} from '@reduxjs/toolkit';

import projectSlice from '../project/slice';
import {initialState, Tool} from './types';
import {ClipMarker, EnvelopeType} from '../types';
import appSlice from '../app/slice';

const trimmingSlice = createSlice({
  name: 'editingTools',
  initialState,
  reducers: {
    enableSelect(state) {
      state.active = Tool.Cursor;
    },

    enableMarkers(state) {
      state.active = Tool.Markers;
    },

    selectMarker(state, action: PayloadAction<{markerId: string | undefined}>) {
      state.selectedMarkerId = action.payload.markerId;
    },

    editMarker(state, action: PayloadAction<{marker: ClipMarker | undefined}>) {
      state.editingMarker = action.payload.marker;
    },

    /**
     * Enable the pen tool for a clip
     * When enabled on a clip that already has an envelope, the pen tool will extend the clip duration
     * @param action.clipId the clip id
     * @param action.type the envelope type where the pen was triggered
     */
    enablePen(
      state,
      action: PayloadAction<{clipId: string; envelope: EnvelopeType}>,
    ) {
      state.active = Tool.Pen;
      state.penData = {
        clipId: action.payload.clipId,
        envelope: action.payload.envelope,
      };
    },

    /**
     * Restore the state when the custom haptic edit is cancelled
     * @param action.clipId the clip id
     */
    cancelPenEdit(state) {
      state.active = Tool.Cursor;
      state.penData = undefined;
    },

    enableEmphasis(state) {
      state.active = Tool.Emphasis;
    },

    enableTrim(
      state,
      action: PayloadAction<{duration: number; time?: number}>,
    ) {
      state.trimData = {
        duration: action.payload.duration,
        time: action.payload.time,
      };
      state.active = Tool.Trim;
    },

    cancelTrim(state) {
      state.active = Tool.Cursor;
    },

    revertTrim(state) {
      state.active = Tool.Cursor;
      state.trimData = undefined;
    },

    setTrimTime(state, action: PayloadAction<{time: number | undefined}>) {
      if (state.trimData) {
        if (action.payload.time === undefined) {
          state.trimData.time = undefined;
          return;
        }
        state.trimData.time = state.trimData.duration
          ? Math.min(action.payload.time, state.trimData.duration)
          : action.payload.time;
      }
    },

    commitTrim(state, action: PayloadAction<{time: number | undefined}>) {
      state.active = Tool.Cursor;
    },
  },
  extraReducers: builder => {
    builder.addCase(projectSlice.actions.setCurrentClip, (state, action) => {
      state.active = Tool.Cursor;
      state.trimData = undefined;
      state.penData = undefined;
    });
    builder.addCase(appSlice.actions.setSelectedEnvelope, (state, action) => {
      if (state.active === Tool.Emphasis) {
        state.active = Tool.Cursor;
      }
    });
    builder.addCase(projectSlice.actions.updateMarker, (state, action) => {
      state.editingMarker = undefined;
    });
    builder.addCase(projectSlice.actions.createMarker, (state, action) => {
      state.editingMarker = action.payload.marker;
      state.selectedMarkerId = action.payload.marker.id;
    });
    builder.addCase(projectSlice.actions.setSelectedPoints, (state, action) => {
      if (action.payload.points.length > 1) {
        state.active = Tool.Cursor;
      }
    });
    builder.addMatcher(
      isAnyOf(
        projectSlice.actions.setSelection,
        projectSlice.actions.selectAllPoints,
        projectSlice.actions.createMarker,
      ),
      state => {
        state.active = Tool.Cursor;
      },
    );
  },
});

export default trimmingSlice;
