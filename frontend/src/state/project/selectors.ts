/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {shallowEqual, useSelector} from 'react-redux';
import {createSelector} from '@reduxjs/toolkit';
import {defaultDspSettings} from '../dsp';

import {Audio, Clip} from '../types';
import {RootState} from '../store';
import {clipDuration} from '../../globals/utils';

export const selectProjectLoading = (state: RootState): boolean =>
  state.project.loading;

export const selectProjectInfo = (state: RootState) => ({
  isOpen: state.project.isOpen,
  name: state.project.name,
  description: state.project.description,
  category: state.project.category,
  slug: state.project.slug,
  version: state.project.version,
  isSample: state.project.isSample,
  isTutorial: state.project.isTutorial,
  isAuthoringTutorial: state.project.isAuthoringTutorial,
});

export const selectCurrentClipId = (state: RootState): string | undefined =>
  state.project.currentClipId;

export const selectSessionId = (state: RootState): string | undefined =>
  state.project.sessionId;

export const selectSelection = (state: RootState) => state.project.selection;

export const selectGroups = (state: RootState) => state.project.groups;

export const selectClips = (state: RootState) => state.project.clips;

// Memoized selectors using createSelector
export const selectSelectedClips = createSelector(
  [selectGroups, selectSelection],
  (groups, selection) => {
    const clips = groups
      .filter(g => selection.groups.includes(g.id))
      .flatMap(g => g.clips);
    return selection.clips.concat(clips);
  },
);

export const selectSelectedClipsWithAudio = createSelector(
  [selectGroups, selectSelection, selectClips],
  (groups, selection, clips) => {
    const groupClips = groups
      .filter(g => selection.groups.includes(g.id))
      .flatMap(g =>
        g.clips.filter(
          c => clips[c].audio !== undefined && clips[c].audio?.path,
        ),
      );
    return selection.clips
      .filter(id => clips[id].audio !== undefined && clips[id].audio?.path)
      .concat(groupClips);
  },
);

export const selectCanGroupClips = createSelector(
  [selectSelection, selectGroups],
  (selection, groups) => {
    if (selection.groups.length > 1) return true;
    if (selection.clips.length === 0) return false;
    if (selection.groups.length === 1) return true;

    const clipsGroups = selection.clips.flatMap(clipId =>
      groups.filter(g => g.clips.includes(clipId)),
    );
    if (clipsGroups.some(g => g.id !== clipsGroups[0].id)) return true;

    return !clipsGroups
      .filter(g => g.isFolder)
      .some(g => g.clips.every(c => selection.clips.includes(c)));
  },
);

export const selectCanUngroupClips = createSelector(
  [selectSelection, selectGroups],
  (selection, groups) => {
    return (
      selection.groups.length !== 0 ||
      selection.clips.some(
        c => groups.findIndex(g => g.isFolder && g.clips.includes(c)) >= 0,
      )
    );
  },
);

export const selectClipIds = createSelector([selectGroups], groups =>
  groups.flatMap(g => g.clips),
);

export const selectClipsCount = createSelector(
  [selectClips],
  clips => Object.keys(clips).length,
);

export const selectCurrentClip = createSelector(
  [selectCurrentClipId, selectClips],
  (currentClipId, clips): Clip | undefined => {
    if (currentClipId && clips[currentClipId]) {
      return clips[currentClipId];
    }
    return undefined;
  },
);

export const selectMarkers = createSelector(
  [selectCurrentClip],
  currentClip => currentClip?.markers ?? [],
);

export const selectHasCurrentClipUndos = createSelector(
  [selectCurrentClip],
  (currentClip): boolean => {
    return currentClip ? currentClip.state.past.length > 0 : false;
  },
);

export const selectHasCurrentClipRedos = createSelector(
  [selectCurrentClip],
  (currentClip): boolean => {
    return currentClip ? currentClip.state.future.length > 0 : false;
  },
);

export const selectCurrentClipLoading = createSelector(
  [selectCurrentClip],
  (currentClip): boolean => {
    return currentClip?.loading ?? false;
  },
);

export const selectCurrentClipOriginalDuration = (state: RootState): number => {
  if (
    !state.project.currentClipId ||
    !state.project.clips[state.project.currentClipId] ||
    !state.project.clips[state.project.currentClipId].state.present.haptic
  ) {
    return 0;
  }
  return clipDuration(state.project.clips[state.project.currentClipId]);
};

export const selectEnvelopePointCount = createSelector(
  [selectCurrentClip],
  (clip): {amplitude: number; frequency: number} => {
    if (!clip || !clip.state.present.haptic) {
      return {amplitude: 0, frequency: 0};
    }
    const {amplitude, frequency} =
      clip.state.present.haptic.signals.continuous.envelopes;
    return {amplitude: amplitude.length, frequency: frequency?.length ?? 0};
  },
);

export const selectCurrentClipAudio = createSelector(
  [selectCurrentClip],
  (clip): Audio | undefined => clip?.audio,
);

export default {
  getProjectLoading(): boolean {
    return useSelector(selectProjectLoading);
  },

  getProjectInfo() {
    return useSelector(selectProjectInfo, shallowEqual);
  },

  getCurrentClipId(): string | undefined {
    return useSelector(selectCurrentClipId);
  },

  getSessionId(): string | undefined {
    return useSelector(selectSessionId);
  },

  getSelectedClips(): string[] {
    return useSelector(selectSelectedClips, shallowEqual);
  },

  getSelectedClipsWithAudio(): string[] {
    return useSelector(selectSelectedClipsWithAudio, shallowEqual);
  },

  getSelection() {
    return useSelector(selectSelection, shallowEqual);
  },

  canGroupClips(): boolean {
    return useSelector(selectCanGroupClips);
  },

  canUngroupClips(): boolean {
    return useSelector(selectCanUngroupClips);
  },

  getGroups() {
    return useSelector(selectGroups, shallowEqual);
  },

  getClipIds(): string[] {
    return useSelector(selectClipIds, shallowEqual);
  },

  getClips() {
    return useSelector(selectClips);
  },

  getClipsCount(): number {
    return useSelector(selectClipsCount);
  },

  getMarkers() {
    return useSelector(selectMarkers, shallowEqual);
  },

  getCurrentClip(): Clip | undefined {
    return useSelector(selectCurrentClip);
  },

  hasCurrentClipUndos(): boolean {
    return useSelector(selectHasCurrentClipUndos);
  },

  hasCurrentClipRedos(): boolean {
    return useSelector(selectHasCurrentClipRedos);
  },

  getCurrentClipLoading(): boolean {
    return useSelector(selectCurrentClipLoading);
  },

  getEnvelopePointCount(): {amplitude: number; frequency: number} {
    return useSelector(selectEnvelopePointCount, shallowEqual);
  },

  getCurrentClipOriginalDuration(): number {
    return useSelector(selectCurrentClipOriginalDuration);
  },

  getCurrentClipAudio(): Audio | undefined {
    return useSelector(selectCurrentClipAudio);
  },
};

export const getEmptyClip = (): Clip => ({
  name: '',
  audio: undefined,
  svg: undefined,
  loading: false,
  hasChanges: {
    amplitude: false,
    frequency: false,
  },
  failed: false,
  error: undefined,
  timeline: undefined,
  playhead: 0,
  markers: [],
  trimAt: undefined,
  state: {
    past: [],
    present: {
      revision: 0,
      haptic: undefined,
      dsp: defaultDspSettings(),
      selectedPoints: [],
      selectedEmphasis: undefined,
    },
    future: [],
  },
});
