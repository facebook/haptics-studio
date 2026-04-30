/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-restricted-syntax */

import {Dispatch} from 'react';
import {AnyAction} from 'redux';
import {v4 as uuidv4} from 'uuid';

import {Clip, ClipGroup} from '../../state/types';
import {State} from '../../state';
import {defaultDspSettings} from '../../state/dsp';
import {ProjectSelection} from '../../state/project/types';

/**
 * Return an unique name for a clip based on the other clips on the same level
 * @param current the current clip name
 * @param otherNames the names of the other clips
 * @returns the new unique name
 */
export const getUniqueName = (
  current: string,
  otherNames: string[],
): string => {
  let name = current;
  const baseName = name.replace(/\s\(\d+\)$/, '');
  let isInOtherNames = false;
  for (const n of otherNames) {
    if (n === name) {
      isInOtherNames = true;
    }
    const match = new RegExp(
      `${baseName.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&')}\\s\\((\\d+)\\)$`,
    ).exec(n);
    if (match && match.length > 1) {
      name = `${baseName} (${parseInt(match[1], 10) + 1})`;
      isInOtherNames = false;
    }
  }
  if (isInOtherNames) {
    return `${name} (1)`;
  }
  return name;
};

/**
 * Prepare the data structure for clip duplication
 * @param selection the clips and groups selected
 * @param groups the initial groups
 * @param clips the clips collection
 * @returns the new groups and clips collection, plus the duplicate message payload expected by the backend
 */
export const duplicatedClipsAndGroups = (
  selection: ProjectSelection,
  groups: ClipGroup[],
  clips: Record<string, Clip>,
): {
  groups: ClipGroup[];
  clips: Record<string, Clip>;
  duplicatedClips: {originalClipId: string; clipId: string; name: string}[];
  duplicatedGroups: string[];
} => {
  const updatedGroups = [...groups];
  const newClips: Record<string, Clip> = {};
  const duplicatedGroups: string[] = [];

  // Duplicate the selected clips
  const duplicatedClips = selection.clips
    .concat(
      groups.filter(g => selection.groups.includes(g.id)).flatMap(g => g.clips),
    )
    .map(id => {
      const clipId = uuidv4();
      const originalGroup = groups.find(g => g.clips.includes(id));

      // Clips that are part of selected groups will be handled in the group duplication below
      if (originalGroup && selection.groups.includes(originalGroup.id)) {
        newClips[clipId] = {...clips[id]};
        return {
          originalClipId: id,
          clipId,
          name: clips[id].name,
        };
      }

      // For clips not part of selected groups, create their standalone entry
      const groupIndex = updatedGroups.findIndex(g => g.clips.includes(id));
      let {name} = clips[id];

      if (updatedGroups[groupIndex].isFolder) {
        // Add the new clip to the correct group
        const originalIndex = updatedGroups[groupIndex].clips.indexOf(id);
        const updatedClips = [...updatedGroups[groupIndex].clips];
        updatedClips.splice(originalIndex + 1, 0, clipId);
        updatedGroups[groupIndex] = {
          ...updatedGroups[groupIndex],
          clips: updatedClips,
        };
      } else {
        // Create a new group for the new clip
        updatedGroups.splice(groupIndex + 1, 0, {
          ...updatedGroups[groupIndex],
          id: uuidv4(),
          clips: [clipId],
        });
      }

      // Check for duplicate names, and add an index if needed
      let otherNames: string[];

      if (updatedGroups[groupIndex].isFolder) {
        otherNames = groups
          .find(g => g.clips.includes(id))!
          .clips.map(c => clips[c].name)
          .sort();
      } else {
        otherNames = groups
          .filter(g => !g.isFolder)
          .map(g => g.clips[0])
          .map(c => clips[c].name)
          .sort();
      }

      name = getUniqueName(name, otherNames);

      const {audio} = clips[id];
      if (audio) {
        newClips[clipId] = {...clips[id], name, audio};
      } else {
        newClips[clipId] = {...clips[id], name};
      }

      return {
        originalClipId: id,
        clipId,
        name,
      };
    });

  // Duplicate the selected groups
  selection.groups.forEach(id => {
    const groupIndex = updatedGroups.findIndex(g => g.id === id);

    let name = updatedGroups[groupIndex].name ?? '';
    // Check for duplicate names, and add an index if needed
    const otherNames: string[] = updatedGroups.map(g => g.name ?? '');
    name = getUniqueName(name, otherNames);

    const newId = uuidv4();
    duplicatedGroups.push(newId);

    updatedGroups.splice(groupIndex + 1, 0, {
      ...updatedGroups[groupIndex],
      id: newId,
      name,
      clips: duplicatedClips
        .filter(d => updatedGroups[groupIndex].clips.includes(d.originalClipId))
        .map(d => d.clipId),
    });
  });

  return {
    groups: updatedGroups,
    clips: newClips,
    duplicatedClips,
    duplicatedGroups,
  };
};

export const analyzeFiles = (
  files: File[],
  dispatch: Dispatch<AnyAction>,
  actions: State['actionCreators'],
): void => {
  if (files.length === 0) return;

  const sortedFiles = files.sort((a, b) => a.name.localeCompare(b.name));
  dispatch(
    actions.project.analyzeFiles({
      files: sortedFiles,
      settings: defaultDspSettings(),
    }),
  );
};
