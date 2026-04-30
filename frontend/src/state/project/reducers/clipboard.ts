/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {original} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';
import {pastedEnvelopes} from '../../../globals/utils';
import type {AmplitudeBreakpoint} from '../../../../../main/src/hapticsSdk';
import {ClipboardContent, EnvelopeType} from '../../types';
import {ProjectState} from '../types';
import {updatedClipState} from './helpers';

export const clipboardReducers = {
  /**
   * Copy or cut the selection to the clipboard
   * @param action.clipId the current clip, if not provided, the current clip will be used
   * @param action.cut boolean that switches between copy and cut
   */
  copySelectedPoints(
    _state: ProjectState,
    _action: PayloadAction<{clipId?: string; cut: boolean}>,
  ) {},

  /**
   * Paste the copied points from the clipboard to the clipboard confirmation UI
   * @param action.clipId the current clip
   * @param action.clipboard the clipboard content
   */
  pastePoints(
    state: ProjectState,
    action: PayloadAction<{clipId?: string; clipboard: ClipboardContent}>,
  ) {
    const clip =
      state.clips[action.payload.clipId ?? state.currentClipId ?? ''];
    if (!clip) return;

    if (
      action.payload.clipboard.amplitude.length > 0 ||
      action.payload.clipboard.frequency.length > 0
    ) {
      clip.state.present.selectedPoints = [];
    }

    clip.state = updatedClipState(clip, original(clip.state.present));
  },

  /**
   * Cancel the clipboard confirmation UI
   */
  cancelPaste(_state: ProjectState) {},

  /**
   * Commit the pasted points to the clip's envelope
   * @param action.clipId the current clip
   * @param action.clipboard the clipboard content
   * @param action.offset the time offset
   * @param action.inPlace if true, will insert the clipoard points in place, i.e. at the original time
   */
  confirmPaste(
    state: ProjectState,
    action: PayloadAction<{
      clipId: string | undefined;
      clipboard: ClipboardContent;
      offset: number;
      inPlace: boolean;
    }>,
  ) {
    const clip =
      state.clips[action.payload.clipId ?? state.currentClipId ?? ''];
    if (!clip) return;

    const content: ClipboardContent = action.payload.clipboard;
    if (
      clip.state.present.haptic &&
      (content.amplitude.length > 0 || content.frequency.length > 0)
    ) {
      const {amplitude, frequency} = pastedEnvelopes(
        clip.state.present.haptic.signals.continuous.envelopes,
        content,
        action.payload.offset ?? 0,
        action.payload.inPlace,
      );

      clip.hasChanges = {
        amplitude: true,
        frequency: true,
      };
      clip.state.present.haptic.signals.continuous.envelopes.amplitude =
        amplitude as any;
      clip.state.present.haptic.signals.continuous.envelopes.frequency =
        frequency as any;
      clip.state.present.revision += 1;

      clip.state = updatedClipState(clip, original(clip.state.present));
    }
  },

  /**
   * Commit the pasted points to the clip's envelope at the original time
   * @param action.clipId the current clip, if not provided, the current clip will be used
   * @param action.points the clipboard content
   */
  pastePointsInPlace(
    _state: ProjectState,
    _action: PayloadAction<{clipId?: string; points: ClipboardContent}>,
  ) {},

  /**
   * Pastes only those breakpoints in the clipboard that have emphasis, all other breakpoints are ignored.
   * Empty trigger; the actual envelope update is performed by a listener middleware
   * which dispatches `confirmPasteEmphasis`.
   * @param action.clipId the current clip, if not provided, the current clip will be used
   * @param action.points the clipboard content
   */
  pasteEmphasisInPlace(
    _state: ProjectState,
    _action: PayloadAction<{clipId?: string; points: ClipboardContent}>,
  ) {},

  /**
   * Apply the precomputed amplitude envelope produced by an emphasis paste.
   * @param action.clipId the clip to update
   * @param action.amplitude the new amplitude envelope
   */
  confirmPasteEmphasis(
    state: ProjectState,
    action: PayloadAction<{
      clipId: string | undefined;
      amplitude: AmplitudeBreakpoint[];
    }>,
  ) {
    const clip =
      state.clips[action.payload.clipId ?? state.currentClipId ?? ''];
    if (!clip?.state.present.haptic) return;

    clip.hasChanges[EnvelopeType.Amplitude] = true;
    clip.state.present.haptic.signals.continuous.envelopes.amplitude =
      action.payload.amplitude;
    clip.state.present.revision += 1;
    clip.state = updatedClipState(clip, original(clip.state.present));
  },
};
