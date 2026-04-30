/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Clip Operations - CRUD operations for project clips
 *
 * Pure functions that operate on ProjectContent to manage clips.
 */

import {cloneDeep, isEmpty, isNil} from 'lodash';
import {MetaData, VisualWaveform} from '../../hapticsSdk';
import {Clip, ClipInfo, OathSettings, ProjectContent} from './types';

/**
 * Get all clips from project content
 */
export const getClips = (content: ProjectContent | undefined): Clip[] => {
  if (!isNil(content)) {
    const {clips = []} = content;
    return clips;
  }
  return [];
};

/**
 * Get the current clip based on state
 */
export const getCurrentClip = (
  content: ProjectContent | undefined,
): Clip | undefined => {
  if (!isNil(content)) {
    const {state, clips} = content;
    if (state) {
      const {clipId} = state;
      return clips.find(c => c.clipId === clipId);
    }
  }
  return undefined;
};

/**
 * Get a clip by its ID
 */
export const getClipById = (
  content: ProjectContent | undefined,
  id: string,
): Clip | undefined => {
  if (!isNil(content)) {
    const {clips} = content;
    return clips.find(c => c.clipId === id);
  }
  return undefined;
};

/**
 * Add a new clip or update an existing one
 * Returns true if the content was modified
 */
export const addOrUpdateClip = (
  content: ProjectContent | undefined,
  clipInfo: ClipInfo,
  generateMetadata: (clip: Clip) => MetaData,
): boolean => {
  if (isNil(content)) return false;

  const {
    clipId = '',
    name = '',
    svg,
    haptic,
    settings,
    audio,
  } = clipInfo;

  const {clips} = content;
  let clip: Clip | undefined = clips.find(c => c.clipId === clipId);

  if (isNil(clip)) {
    const newClip: Clip = {
      clipId,
      name,
      audioAsset: {
        ...audio,
        channels: clipInfo.audio?.channels || 1,
      },
      waveform: svg as VisualWaveform,
      settings: settings as OathSettings,
      haptic,
      lastUpdate: Date.now(),
    };
    // If we are importing an Haptic file we need to add the unconfirmed path for the audio file to link
    if (newClip.audioAsset && !isNil(audio?.hapticPath)) {
      newClip.audioAsset.hapticPath = audio?.hapticPath;
    }
    // Add metadata
    const metadata: MetaData = generateMetadata(newClip);
    if (haptic) haptic.metadata = metadata;
    clips.push(newClip);
    clip = newClip;
  } else {
    // Add metadata
    const metadata: MetaData = generateMetadata(clip);
    if (haptic) haptic.metadata = metadata;
    // Update the haptic data
    clip.haptic = haptic;
    if (settings && !isEmpty(settings)) {
      clip.settings = settings;
    }
    clip.lastUpdate = Date.now();
  }

  return true;
};

/**
 * Delete a clip from the project
 * Returns true if the content was modified
 */
export const deleteClip = (
  content: ProjectContent | undefined,
  clipId: string,
): boolean => {
  if (!isNil(content)) {
    const clips: Clip[] = content.clips.filter(c => c.clipId !== clipId);
    content.clips = clips;
    return true;
  }
  return false;
};

/**
 * Update a clip's content
 * Returns true if the content was modified
 */
export const updateClip = (
  content: ProjectContent | undefined,
  clipId: string,
  clipContent: Clip,
): boolean => {
  if (!isNil(content)) {
    const index = content.clips.findIndex(c => c.clipId === clipId);
    if (index > -1) {
      content.clips[index] = {
        ...clipContent,
        clipId,
        lastUpdate: Date.now(),
      };
      return true;
    }
  }
  return false;
};

/**
 * Duplicate a clip
 * Returns true if the content was modified
 */
export const duplicateClip = (
  content: ProjectContent | undefined,
  originalClipId: string,
  newClipId: string,
  newName: string,
): boolean => {
  if (!isNil(content)) {
    const originalClip = getClipById(content, originalClipId);
    if (originalClip) {
      const newClip = {
        ...cloneDeep(originalClip),
        clipId: newClipId,
        name: newName,
      };
      content.clips.push(newClip);
      return true;
    }
  }
  return false;
};
