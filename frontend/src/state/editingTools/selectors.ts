/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {shallowEqual, useSelector} from 'react-redux';
import {createSelector} from '@reduxjs/toolkit';

import {RootState} from '../store';
import {Tool} from './types';

export const selectEditingToolsState = (state: RootState) => state.editingTools;

export const selectActiveTool = (state: RootState): Tool =>
  state.editingTools.active;

export const selectSelectedMarkerId = (state: RootState): string | undefined =>
  state.editingTools.selectedMarkerId;

export const selectEditingMarker = (state: RootState) =>
  state.editingTools.editingMarker;

export const selectIsTrimmingEnabled = createSelector(
  [selectActiveTool],
  (activeTool): boolean => activeTool === Tool.Trim,
);

export const selectTrimData = (state: RootState) => state.editingTools.trimData;

export const selectTrimTime = (state: RootState): number | undefined => {
  if (state.editingTools.active === Tool.Trim && state.editingTools.trimData) {
    return (
      state.editingTools.trimData.time ?? state.editingTools.trimData.duration
    );
  }
  if (
    state.project.currentClipId &&
    state.project.clips[state.project.currentClipId]
  ) {
    return state.project.clips[state.project.currentClipId].trimAt;
  }
  return undefined;
};

export default {
  getActiveTool(): Tool {
    return useSelector(selectActiveTool);
  },

  getSelectedMarkerId(): string | undefined {
    return useSelector(selectSelectedMarkerId);
  },

  getEditingMarker() {
    return useSelector(selectEditingMarker);
  },

  isTrimmingEnabled(): boolean {
    return useSelector(selectIsTrimmingEnabled);
  },

  getTrimTime(): number | undefined {
    return useSelector(selectTrimTime, shallowEqual);
  },
};
