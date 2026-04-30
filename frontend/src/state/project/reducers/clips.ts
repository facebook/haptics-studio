/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {v4 as uuidv4} from 'uuid';

import type {PayloadAction} from '@reduxjs/toolkit';
import {DefaultEmptyClipDuration} from '../../../globals/constants';
import {defaultDspSettings} from '../../dsp';
import {Clip, ClipGroup} from '../../types';
import {HapticData} from '../../../../../main/src/hapticsSdk';
import {ProjectState} from '../types';

export const clipsReducers = {
  /**
   * Create an empty clip
   */
  createEmptyClip: {
    reducer(
      state: ProjectState,
      action: PayloadAction<{clipId: string; name: string}>,
    ) {
      const {clipId, name} = action.payload;
      state.groups = [
        ...state.groups,
        {
          id: uuidv4(),
          name: 'New Group',
          isFolder: false,
          clips: [clipId],
        },
      ];
      state.clips[clipId] = {
        name,
        loading: false,
        failed: false,
        error: undefined,
        audio: undefined,
        hasChanges: {
          amplitude: false,
          frequency: false,
        },
        svg: undefined,
        timeline: {
          startTime: 0,
          endTime: DefaultEmptyClipDuration,
          duration: DefaultEmptyClipDuration,
          samples: 0,
        },
        playhead: 0,
        markers: [],
        trimAt: undefined,
        state: {
          present: {
            revision: 0,
            haptic: undefined,
            dsp: defaultDspSettings(),
            selectedPoints: [],
            selectedEmphasis: undefined,
          },
          past: [],
          future: [],
        },
      };
      state.currentClipId = clipId;
      state.selection = {clips: [clipId], groups: [], lastSelected: clipId};
    },
    prepare: (params?: {clipId: string}) => {
      return {
        payload: {
          clipId: params?.clipId ?? uuidv4(),
          name: 'New Clip',
        },
      };
    },
  },

  /**
   * Import new clips
   * @param action.clips new clips to import
   * @param action.groups new groups to import
   */
  addNewClips(
    state: ProjectState,
    action: PayloadAction<{groups: ClipGroup[]; clips: Record<string, Clip>}>,
  ) {
    state.clips = {...state.clips, ...action.payload.clips};
    state.groups = [...state.groups, ...action.payload.groups];
  },

  /**
   * Add duplicated clips
   * @param action.clips new clips to add
   * @param action.groups new groups to add
   */
  addDuplicatedClips(
    state: ProjectState,
    action: PayloadAction<{groups: ClipGroup[]; clips: Record<string, Clip>}>,
  ) {
    state.clips = {...state.clips, ...action.payload.clips};
    state.groups = action.payload.groups;
  },

  /**
   * Rename a group of clips
   * @param action.clipId the clip id
   * @param action.name the new name
   */
  renameClip(
    state: ProjectState,
    action: PayloadAction<{clipId: string; name: string}>,
  ) {
    state.clips[action.payload.clipId].name = action.payload.name;
  },

  /**
   * Duplicate selected clips
   */
  duplicateSelectedClip() {},

  /**
   * Delete a group of clips
   * @param action.clipIds the clips ids
   */
  deleteClips(state: ProjectState, action: PayloadAction<{clipIds: string[]}>) {
    action.payload.clipIds.forEach((clipId: string) => {
      delete state.clips[clipId];
    });
    const groups = state.groups
      .map(group => {
        return {
          ...group,
          clips: group.clips.filter(c => !action.payload.clipIds.includes(c)),
        };
      })
      .filter(g => g.clips.length > 0);
    state.groups = groups;
    state.selection = {clips: [], groups: []};
    state.currentClipId = undefined;
  },

  /**
   * Set a clip as current, displaying it in the editor panel
   * @param action.id the clip id
   */
  setCurrentClip(state: ProjectState, action: PayloadAction<{id: string}>) {
    if (!(action.payload.id in state.clips)) return;
    return {
      ...state,
      currentClipId: action.payload.id,
      selection: {
        clips: [action.payload.id],
        groups: [],
        lastSelected: action.payload.id,
      },
    };
  },

  /**
   * Switch to the given clip
   * @param action.clipId the clip id
   */
  switchClip(_state: ProjectState, _action: PayloadAction<{clipId: string}>) {},

  /**
   * Set the clip that is undergoing analysis
   * @param action.clipId the clip id
   */
  setCurrentAnalysis(
    state: ProjectState,
    action: PayloadAction<{clipId: string}>,
  ) {
    state.clips[action.payload.clipId].loading = true;
  },

  /**
   * Update the local Haptic
   * @param action.clipId the clip id
   * @param action.haptic the full Haptic format
   */
  updateHaptic(
    _state: ProjectState,
    _action: PayloadAction<{clipId: string; haptic: HapticData}>,
  ) {},

  /**
   * Update haptic failed
   * @param action.clipId the clip id
   * @param action.error the error
   */
  updateHapticFailure(
    _state: ProjectState,
    _action: PayloadAction<{clipId: string; error: string}>,
  ) {},

  /**
   * Update the tutorial notes attached to a clip
   * @param action.clipId the clip id
   * @param action.notes the tutorial notes
   */
  updateTutorialNotes(
    state: ProjectState,
    action: PayloadAction<{clipId: string; notes: string}>,
  ) {
    const clip =
      state.clips[action.payload.clipId ?? state.currentClipId ?? ''];
    if (!clip) return;

    clip.notes = action.payload.notes;
  },
};
