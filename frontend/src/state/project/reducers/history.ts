/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {PayloadAction} from '@reduxjs/toolkit';
import {ProjectState} from '../types';

export const historyReducers = {
  /**
   * Undo last action
   * @param action.clipId the clip id, if not provided the current clip will be used
   */
  undo(state: ProjectState, action: PayloadAction<{clipId?: string}>) {
    const clip =
      state.clips[action?.payload.clipId ?? state.currentClipId ?? ''];
    if (!clip) return;
    if (clip.state.past.length <= 0) return;

    const present = {...clip.state.present};
    const previous = clip.state.past[clip.state.past.length - 1];
    const past = clip.state.past.slice(0, clip.state.past.length - 1);

    clip.state.present = previous;
    clip.state.past = past;
    clip.state.future = [present, ...clip.state.future];
  },

  /**
   * Redo previous undo action
   * @param action.clipId the clip id, if not provided the current clip will be used
   */
  redo(state: ProjectState, action: PayloadAction<{clipId?: string}>) {
    const clip =
      state.clips[action?.payload.clipId ?? state.currentClipId ?? ''];
    if (!clip) return;

    if (clip.state.future.length <= 0) return;

    const next = clip.state.future[0];
    const future = clip.state.future.slice(1);

    clip.state.past = [...clip.state.past, clip.state.present];
    clip.state.present = next;
    clip.state.future = future;
  },
};
