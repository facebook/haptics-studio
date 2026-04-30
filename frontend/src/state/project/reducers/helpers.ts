/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';
import {v4 as uuidv4} from 'uuid';

import {original} from '@reduxjs/toolkit';
import {UndoHistorySize} from '../../../globals/constants';
import {defaultDspSettings} from '../../dsp';
import {
  AmplitudeBreakpoint,
  FrequencyBreakpoint,
} from '../../../../../main/src/hapticsSdk';
import type {Envelopes} from '../../../../../main/src/hapticsSdk';
import {
  AnalysisRequest,
  Clip,
  ClipHistory,
  ClipState,
  EnvelopeBreakpoint,
  EnvelopeType,
} from '../../types';
import {ProjectState} from '../types';

export const updatedClipState = (
  clip: Clip,
  originalState?: ClipState,
): ClipHistory => {
  if (!originalState) return clip.state;

  const past = [...clip.state.past, originalState];
  clip.state.past = past.length > UndoHistorySize ? past.slice(1) : past;
  clip.state.future = [];
  return clip.state;
};

/**
 * Sets the envelope data on the envelopes object for the given envelope type.
 */
export function setEnvelopeData(
  envelopes: Envelopes,
  envelope: EnvelopeType,
  data: EnvelopeBreakpoint[],
): void {
  if (envelope === EnvelopeType.Amplitude) {
    envelopes.amplitude = data as AmplitudeBreakpoint[];
  } else {
    envelopes.frequency = data as FrequencyBreakpoint[];
  }
}

/**
 * Resolves a clip from state given an optional clipId.
 * Falls back to the current clip if no clipId is provided.
 */
export function resolveClip(
  state: ProjectState,
  clipId: string | undefined,
): Clip | undefined {
  return state.clips[clipId ?? state.currentClipId ?? ''];
}

/**
 * Common pattern for editing envelope data on a clip.
 * Handles: resolving clip, null guards, copying data, setting hasChanges,
 * updating envelope data, incrementing revision, and updating undo history.
 *
 * @param mutate receives the copied envelope data and the clip draft;
 *   return the modified data array, or void to use the array passed in
 */
export function withEnvelopeEdit(
  state: ProjectState,
  clipId: string | undefined,
  envelope: EnvelopeType,
  mutate: (
    data: EnvelopeBreakpoint[],
    clip: Clip,
  ) => EnvelopeBreakpoint[] | void,
): void {
  const clip = resolveClip(state, clipId);
  if (!clip?.state.present.haptic) return;

  const envelopes = clip.state.present.haptic.signals.continuous.envelopes;
  const data: EnvelopeBreakpoint[] = [...(envelopes[envelope] || [])];
  const result = mutate(data, clip);

  clip.hasChanges[envelope] = true;
  setEnvelopeData(envelopes, envelope, result ?? data);
  clip.state.present.revision += 1;
  clip.state = updatedClipState(clip, original(clip.state.present));
}

/**
 * Common pattern for editing amplitude envelope data (used by emphasis reducers).
 * Handles: resolving clip, null guards, copying amplitude data, setting hasChanges,
 * updating amplitude data, incrementing revision, and updating undo history.
 *
 * @param mutate receives the copied amplitude data and the clip draft
 */
export function withAmplitudeEdit(
  state: ProjectState,
  clipId: string | undefined,
  mutate: (data: AmplitudeBreakpoint[], clip: Clip) => void,
): void {
  const clip = resolveClip(state, clipId);
  if (!clip?.state.present.haptic) return;

  const newData: AmplitudeBreakpoint[] = [
    ...clip.state.present.haptic.signals.continuous.envelopes.amplitude,
  ];
  mutate(newData, clip);

  clip.hasChanges[EnvelopeType.Amplitude] = true;
  clip.state.present.haptic.signals.continuous.envelopes.amplitude = newData;
  clip.state.present.revision += 1;
  clip.state = updatedClipState(clip, original(clip.state.present));
}

export const getAllSelectedClips = (state: ProjectState): string[] => {
  return state.groups.flatMap(g =>
    g.clips.filter(
      c =>
        state.selection.clips.includes(c) ||
        state.selection.groups.includes(g.id),
    ),
  );
};

export const setAndSelectClip = (
  state: ProjectState,
  select: 'next' | 'previous',
): ProjectState => {
  const clips = state.groups.flatMap(g => g.clips);
  const selected = getAllSelectedClips(state);
  const edge = select === 'next' ? selected[selected.length - 1] : selected[0];
  if (selected.length > 0) {
    const current = clips.indexOf(edge);
    const condition: boolean =
      select === 'next' ? current < clips.length - 1 : current > 0;
    if (condition) {
      const currentClip = clips[select === 'next' ? current + 1 : current - 1];
      return {
        ...state,
        selection: {
          clips: [currentClip],
          groups: [],
          lastSelected: currentClip,
        },
        currentClipId: currentClip,
      };
    }
  }
  return state;
};

export const ungroupClipsHelper = (
  state: ProjectState,
  clips: string[],
  to: string,
  position: 'before' | 'after',
): ProjectState => {
  const groups = state.groups.map(g => {
    return {...g, clips: g.clips.filter(c => !(clips as string[]).includes(c))};
  });

  const destinationGroupIndex = state.groups.findIndex(g => g.id === to);
  if (!groups[destinationGroupIndex]) return state;

  const newGroups = (clips as string[]).map((c: string) => {
    return {
      id: uuidv4(),
      isFolder: false,
      name: 'untitled',
      clips: [c],
    };
  });
  groups
    .splice(
      destinationGroupIndex + (position === 'after' ? 1 : 0),
      0,
      ...newGroups,
    )
    .filter(g => g.clips.length > 0);
  return {
    ...state,
    groups: groups.filter(g => g.clips.length > 0),
    selection: {clips, groups: [], lastSelected: clips[clips.length - 1]},
    currentClipId: clips[0],
  };
};

export const prepareClipsForAnalysis = (
  state: ProjectState,
  data: AnalysisRequest,
): Record<string, Clip> => {
  const clips = {...state.clips};
  Object.keys(data).forEach(k => {
    if (clips[k]) {
      clips[k].loading = false;
      clips[k].failed = false;
      clips[k].error = undefined;
    } else {
      clips[k] = {
        name: path.basename(data[k].path, path.extname(data[k].path)),
        loading: false,
        failed: false,
        error: undefined,
        audio: {...data[k], exists: true},
        hasChanges: {
          amplitude: false,
          frequency: false,
        },
        svg: undefined,
        timeline: undefined,
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
    }
  });
  return clips;
};
