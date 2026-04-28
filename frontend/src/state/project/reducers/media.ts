/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {PayloadAction} from '@reduxjs/toolkit';
import {Audio, AudioEnvelope} from '../../types';
import {ProjectState} from '../types';

export const mediaReducers = {
  /**
   * Set an audio asset as missing in a clip
   * @param action.clipId the clip id
   */
  setMissingAsset(
    state: ProjectState,
    action: PayloadAction<{clipId: string}>,
  ) {
    const clip =
      state.clips[action.payload.clipId ?? state.currentClipId ?? ''];
    if (!clip || !clip.audio) return;

    clip.audio.exists = false;
  },

  /**
   * Update the audio path when the user relocates the missing audio file
   * @param action.clipId the clip Id
   * @param action.audio the new audio meta
   */
  relocateAsset(
    state: ProjectState,
    action: PayloadAction<{clipId: string; audio: Audio}>,
  ) {
    const clip =
      state.clips[action.payload.clipId ?? state.currentClipId ?? ''];
    if (!clip || !clip.audio) return;

    clip.audio = action.payload.audio;
  },

  /**
   * Add an audio file to a custom clip
   * @param action.clipId the clip Id
   * @param action.audio the new audio meta
   * @param action.waveform the new svg data
   */
  addAudioToClip(
    state: ProjectState,
    action: PayloadAction<{
      clipId: string;
      audio: Audio;
      waveform: AudioEnvelope;
    }>,
  ) {
    const clip =
      state.clips[action.payload.clipId ?? state.currentClipId ?? ''];
    if (!clip) return;

    clip.audio = action.payload.audio;
    clip.svg = action.payload.waveform;
  },
};
