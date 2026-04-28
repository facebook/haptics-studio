/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {v4 as uuidv4} from 'uuid';
import {original} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';
import {ProjectSelection, ProjectState} from '../types';
import {
  getAllSelectedClips,
  setAndSelectClip,
  ungroupClipsHelper,
  updatedClipState,
} from './helpers';

export const selectionReducers = {
  /**
   * Highlight a clip. If `add` and `range` are false the selection is overwritten
   * @param action.id the clicked clip
   * @param action.add if true, the clip is added to the current selection
   * @param action.range if true, all clip between the current selection and the new selection are selected
   */
  selectClip(
    state: ProjectState,
    action: PayloadAction<{id: string; add: boolean; range: boolean}>,
  ) {
    if (!action.payload.id) return state;

    const fullSelection = getAllSelectedClips(state);
    const group = state.groups.find(
      g => g.isFolder && g.clips.includes(action.payload.id),
    );
    const selectedGroups = state.groups.filter(
      g => g.isFolder && state.selection.groups.includes(g.id),
    );

    if (!action.payload.add && !action.payload.range) {
      return {
        ...state,
        selection: {
          clips: [action.payload.id],
          groups: [],
          lastSelected: action.payload.id,
        },
        currentClipId: action.payload.id,
      };
    }

    if (action.payload.add) {
      if (state.selection.clips.includes(action.payload.id)) {
        if (
          state.selection.clips.length === 1 &&
          state.selection.clips[0] === action.payload.id
        ) {
          return state;
        }
        if (group && state.selection.groups.includes(group.id)) return state;

        const clips = state.selection.clips.filter(
          c => c !== action.payload.id,
        );
        return {
          ...state,
          selection: {
            clips,
            groups: state.selection.groups,
            lastSelected: clips[clips.length - 1],
          },
          currentClipId:
            state.currentClipId === action.payload.id
              ? clips[0]
              : state.currentClipId,
        };
      }

      return {
        ...state,
        selection: {
          clips: [...state.selection.clips, action.payload.id],
          groups: state.selection.groups,
          lastSelected: action.payload.id,
        },
      };
    }

    if (action.payload.range) {
      const clips = state.groups.flatMap(g => g.clips);
      let newSelection: string[] = [];
      const newGroups: string[] = [];
      const lastSelected =
        state.selection.lastSelected || fullSelection[fullSelection.length - 1];
      if (clips.indexOf(lastSelected) < clips.indexOf(action.payload.id)) {
        const start = clips.indexOf(lastSelected);
        const end = clips.indexOf(action.payload.id);
        newSelection = clips.splice(start + 1, end - start);
      } else {
        const start = clips.indexOf(action.payload.id);
        const end = clips.indexOf(lastSelected);
        newSelection = clips.splice(start, end - start);
      }

      newSelection = newSelection.filter(
        n =>
          !state.selection.clips.includes(n) &&
          !selectedGroups.some(g => g.clips.includes(n)),
      );

      state.groups
        .filter(g => g.isFolder && !state.selection.groups.includes(g.id))
        .forEach(g => {
          if (
            (clips.indexOf(lastSelected) < clips.indexOf(action.payload.id) ||
              g.clips[0] !== action.payload.id) &&
            g.clips.every(c => newSelection.includes(c))
          ) {
            newSelection = newSelection.filter(s => !g.clips.includes(s));
            newGroups.push(g.id);
          }
        });

      return {
        ...state,
        selection: {
          clips: state.selection.clips.concat(newSelection),
          groups: state.selection.groups.concat(newGroups),
          lastSelected: action.payload.id,
        },
      };
    }
    return state;
  },

  /**
   * Highlight a set of clips.
   * @param action.ids the selected clips
   */
  selectClips(state: ProjectState, action: PayloadAction<{ids: string[]}>) {
    if (action.payload.ids.length === 0) return state;
    return {
      ...state,
      selection: {
        clips: action.payload.ids,
        groups: [],
        lastSelected: action.payload.ids[action.payload.ids.length - 1],
      },
      currentClipId: action.payload.ids[0],
    };
  },

  /**
   * Highlight a set of clips.
   * @param action the selection state
   */
  setSelection(state: ProjectState, action: PayloadAction<ProjectSelection>) {
    return {
      ...state,
      selection: action.payload,
      currentClipId: action.payload.lastSelected,
    };
  },

  /**
   * Set selected emphasis
   */
  setSelectedEmphasis(
    state: ProjectState,
    action: PayloadAction<{clipId?: string; index: number | undefined}>,
  ) {
    const clip =
      state.clips[action?.payload.clipId ?? state.currentClipId ?? ''];
    if (!clip) return;

    clip.state.present.selectedEmphasis = action.payload.index;
    clip.state.present.revision += 1;

    clip.state = updatedClipState(clip, original(clip.state.present));
  },

  /**
   * Highlight a group. If `add` and `range` are false the selection is overwritten
   * @param action.id the clicked group
   * @param action.add if true, the group is added to the current selection
   * @param action.range if true, all group between the current selection and the new selection are selected
   */
  selectGroup(
    state: ProjectState,
    action: PayloadAction<{id: string; add: boolean; range: boolean}>,
  ) {
    const group = state.groups.find(g => g.id === action.payload.id);
    if (!group || group.clips.length === 0) return state;

    const currentSelection = getAllSelectedClips(state);
    const selectedGroups = state.groups.filter(
      g => g.isFolder && state.selection.groups.includes(g.id),
    );

    if (
      (!action.payload.add && !action.payload.range) ||
      (action.payload.add && currentSelection.length === 0)
    ) {
      return {
        ...state,
        selection: {
          clips: [],
          groups: [action.payload.id],
          lastSelected: group.clips[group.clips.length - 1],
        },
        currentClipId: group.clips[0],
      };
    }

    if (action.payload.add) {
      if (state.selection.groups.includes(action.payload.id)) {
        if (
          state.selection.groups.length === 1 &&
          state.selection.clips.length === 0
        ) {
          return state;
        }
        const groups = state.selection.groups.filter(
          g => g !== action.payload.id,
        );
        const currentClipId =
          groups.length > 0
            ? state.groups.find(
                g =>
                  g.id !== action.payload.id &&
                  state.selection.groups.includes(g.id),
              )?.clips?.[0]
            : state.selection.clips[0];
        return {
          ...state,
          selection: {
            clips: state.selection.clips,
            groups,
            lastSelected: currentSelection[currentSelection.length - 1],
          },
          currentClipId,
        };
      }
      return {
        ...state,
        selection: {
          clips: state.selection.clips.filter(c => !group.clips.includes(c)),
          groups: [...state.selection.groups, action.payload.id],
          lastSelected: group.clips[group.clips.length - 1],
        },
      };
    }

    if (action.payload.range) {
      const clips = state.groups.flatMap(g => g.clips);
      let newSelection: string[] = [];
      const newGroups: string[] = [];
      const lastSelected =
        state.selection.lastSelected ||
        currentSelection[currentSelection.length - 1];
      if (clips.indexOf(lastSelected) < clips.indexOf(group.clips[0])) {
        const start = clips.indexOf(lastSelected);
        const end = clips.indexOf(group.clips[0]);
        newSelection = clips.splice(start + 1, end - start);
      } else if (
        clips.indexOf(lastSelected) >
        clips.indexOf(group.clips[group.clips.length - 1])
      ) {
        const start = clips.indexOf(group.clips[group.clips.length - 1]);
        const end = clips.indexOf(lastSelected);
        newSelection = clips.splice(start + 1, end - start);
      }

      newGroups.push(action.payload.id);

      newSelection = newSelection.filter(
        n =>
          !state.selection.clips.includes(n) &&
          !selectedGroups.some(g => g.clips.includes(n)),
      );

      state.groups
        .filter(g => g.isFolder && !state.selection.groups.includes(g.id))
        .forEach(g => {
          if (g.clips.every(c => newSelection.includes(c))) {
            newSelection = newSelection.filter(s => !g.clips.includes(s));
            newGroups.push(g.id);
          }
        });

      return {
        ...state,
        selection: {
          clips: state.selection.clips
            .concat(newSelection)
            .filter(c => !group.clips.includes(c)),
          groups: state.selection.groups.concat(newGroups),
          lastSelected: action.payload.id,
        },
      };
    }
    return state;
  },

  /**
   * Select the next clip (based on the current selection) and set it as currentClip
   */
  setAndSelectNextClip(state: ProjectState) {
    return setAndSelectClip(state, 'next');
  },

  /**
   * Blanket action for selecting all clips or points based on the context. Handled by the middleware
   */
  selectAll() {},

  /**
   * Select all the clips of the current project
   */
  selectAllClips(state: ProjectState) {
    state.selection = {
      clips: state.groups.filter(g => !g.isFolder).flatMap(g => g.clips),
      groups: state.groups.filter(g => g.isFolder).map(g => g.id),
    };
  },

  /**
   * Select the previous clip (based on the current selection) and set it as currentClip
   */
  setAndSelectPreviousClip(state: ProjectState) {
    return setAndSelectClip(state, 'previous');
  },

  /**
   * Group the current clip selection
   */
  groupSelectedClips(state: ProjectState) {
    const selectedClips = getAllSelectedClips(state);
    const sortedSelection = selectedClips
      .map(clipId => {
        const parentId = state.groups.find(g => g.clips.includes(clipId));
        if (parentId) {
          const index = state.groups.indexOf(parentId);
          return {clipId, index};
        }
        return {clipId, index: 0};
      })
      .sort((a, b) => a.index - b.index);

    const parentGroup = state.groups.find(g =>
      g.clips.includes(sortedSelection[0].clipId),
    )?.id;
    let position: number | undefined;
    if (parentGroup) {
      position = state.groups.findIndex(g => g.id === parentGroup);
    }

    const groups = state.groups
      .map(g => {
        return {
          ...g,
          clips: g.clips.filter(c => !selectedClips.includes(c)),
        };
      })
      .filter(g => g.clips.length > 0);

    const newGroupId = uuidv4();
    groups.splice(position !== undefined ? position : groups.length, 0, {
      id: newGroupId,
      isFolder: true,
      name: 'untitled',
      clips: [...selectedClips],
    });

    return {
      ...state,
      groups,
      selection: {clips: [], groups: [newGroupId], lastSelected: newGroupId},
      currentClipId: selectedClips[0],
    };
  },

  /**
   * Rename a group of clips
   * @param action.id the group id
   * @param action.name the new name
   */
  renameClipGroup(
    state: ProjectState,
    action: PayloadAction<{id: string; name: string}>,
  ) {
    state.groups = state.groups.map(g => {
      if (g.id === action.payload.id) {
        return {...g, name: action.payload.name};
      }
      return g;
    });
  },

  /**
   * Move clips to another group given a destination clip.
   * @param action.toGroup the group id to move the clips to, if not provided the clips will be moved to the root
   * @param action.index the relative index where to place the selection
   */
  moveSelectedClips(
    state: ProjectState,
    action: PayloadAction<{toGroup?: string; index: number}>,
  ) {
    let newGroups = state.groups
      .filter(g => !state.selection.groups.includes(g.id))
      .map(g => {
        return {
          ...g,
          clips: g.clips.filter(c => !state.selection.clips.includes(c)),
        };
      });

    const allSelectedClips = getAllSelectedClips(state);
    const selectedGroups = state.groups.filter(
      g => g.isFolder && state.selection.groups.includes(g.id),
    );

    if (action.payload.toGroup) {
      const groupIndex = newGroups.findIndex(
        g => g.id === action.payload.toGroup,
      );
      if (groupIndex < 0) return state;

      newGroups[groupIndex].clips.splice(
        action.payload.index,
        0,
        ...allSelectedClips,
      );
      newGroups = newGroups.filter(g => g.clips.length !== 0);
      return {
        ...state,
        groups: newGroups,
        selection: {clips: allSelectedClips, groups: []},
      };
    } else {
      const newIndex =
        action.payload.index < state.groups.length
          ? newGroups.findIndex(
              g => g.id === state.groups[action.payload.index].id,
            )
          : newGroups.length;
      newGroups.splice(newIndex, 0, ...selectedGroups);
      state.selection.clips.forEach((c, idx) => {
        newGroups.splice(newIndex + selectedGroups.length + idx, 0, {
          id: uuidv4(),
          isFolder: false,
          name: 'untitled',
          clips: [c],
        });
      });
      newGroups = newGroups.filter(g => g.clips.length !== 0);
      return {...state, groups: newGroups};
    }
  },

  /**
   * Ungroup a set of clips. The clips will be placed before or after a given group
   * @param action.clips the clips to ungroup
   * @param action.to the target group to determine the new position
   * @param action.position either 'before' or 'after'
   */
  ungroupClips(
    state: ProjectState,
    action: PayloadAction<{
      clips: string[];
      to: string;
      position: 'before' | 'after';
    }>,
  ) {
    return ungroupClipsHelper(
      state,
      action.payload.clips,
      action.payload.to,
      action.payload.position,
    );
  },

  /**
   * Ungroup the selected clips
   */
  ungroupSelectedClips(state: ProjectState) {
    const {groups, selection} = state;

    if (
      (selection.clips.length > 0 || selection.groups.length > 0) &&
      groups.length > 0
    ) {
      const currentGroup = groups.find(
        g =>
          (selection.clips.length > 0 &&
            g.clips.includes(selection.clips[0])) ||
          (selection.groups.length > 0 && g.id === selection.groups[0]),
      );
      if (currentGroup) {
        const selectedGroupsClips = groups
          .filter(g => selection.groups.includes(g.id))
          .flatMap(g => g.clips);
        return ungroupClipsHelper(
          state,
          selection.clips.concat(selectedGroupsClips),
          currentGroup.id,
          'before',
        );
      }
    }
    return state;
  },
};
