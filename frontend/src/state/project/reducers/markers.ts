/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {v4 as uuidv4} from 'uuid';
import {original} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';
import {ClipMarker} from '../../types';
import {ProjectState} from '../types';
import {updatedClipState} from './helpers';

export const markersReducers = {
  /**
   * Create a marker and add it to a clip
   * @param action.clipId the clip id, if not provided, the current clip is used
   * @param action.time the timestamp
   * @param action.name the marker name
   */
  createMarker: {
    reducer(
      state: ProjectState,
      action: PayloadAction<{clipId?: string; marker: ClipMarker}>,
    ) {
      const clip =
        state.clips[action.payload.clipId ?? state.currentClipId ?? ''];
      if (!clip) return;

      clip.markers = [...clip.markers, action.payload.marker].sort(
        (a, b) => a.time - b.time,
      );

      clip.state = updatedClipState(clip, original(clip.state.present));
    },
    prepare: (params: {clipId?: string; time: number; name: string}) => {
      return {
        payload: {
          clipId: params.clipId,
          marker: {
            id: uuidv4(),
            name: params.name,
            time: params.time,
          },
        },
      };
    },
  },

  /**
   * Update a marker
   * @param action.clipId the clip id
   * @param action.marker the marker
   */
  updateMarker(
    state: ProjectState,
    action: PayloadAction<{
      clipId?: string;
      markerId: string;
      time?: number;
      name?: string;
    }>,
  ) {
    const clip =
      state.clips[action.payload.clipId ?? state.currentClipId ?? ''];
    if (!clip) return;

    const marker = clip.markers.find(m => m.id === action.payload.markerId);
    if (!marker) return;
    if (action.payload.time !== undefined) {
      marker.time = action.payload.time;
    }
    if (action.payload.name !== undefined) {
      marker.name = action.payload.name;
    }
  },

  /**
   * Update marker failure
   * @param action.clipId the clip id
   * @param action.previous the previous markers
   */
  updateMarkerFailure(
    state: ProjectState,
    action: PayloadAction<{clipId: string; previous: ClipMarker[]}>,
  ) {
    const clip =
      state.clips[action.payload.clipId ?? state.currentClipId ?? ''];
    if (!clip) return;

    clip.markers = action.payload.previous;
  },

  /**
   * Delete a marker
   * @param action.markerId the marker
   * @param action.clipId the clip id
   */
  deleteMarker(
    state: ProjectState,
    action: PayloadAction<{clipId?: string; markerId: string}>,
  ) {
    const clip =
      state.clips[action.payload.clipId ?? state.currentClipId ?? ''];
    if (!clip) return;

    clip.markers = clip.markers.filter(
      marker => marker.id !== action.payload.markerId,
    );
  },
};
