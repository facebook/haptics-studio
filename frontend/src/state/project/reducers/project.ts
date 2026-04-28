/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {v4 as uuidv4} from 'uuid';
import {IOpenPayload} from 'main/src/actions/project';

import type {PayloadAction} from '@reduxjs/toolkit';
import {timelineFor} from '../../../globals/utils';
import {defaultDspSettings, unpackDspSettings} from '../../dsp';
import {
  Clip,
  ClipGroup,
  ProjectMetadata,
  RecentProject,
  SampleProject,
} from '../../types';
import {initialState, ProjectState} from '../types';

export const projectReducers = {
  /**
   * Save the current sessionId (Note: we now use the session id as the project id)
   * @param action.clipId the clip id analyzed
   */
  setCurrentSession(
    state: ProjectState,
    action: PayloadAction<{clipId?: string; sessionId: string}>,
  ) {
    state.sessionId = action.payload.sessionId;

    const clip =
      state.clips[action.payload.clipId ?? state.currentClipId ?? ''];
    if (!clip) return;

    clip.loading = false;
  },

  /**
   * Open a project
   * @param action.project the project or sample project
   */
  openProject(
    state: ProjectState,
    _action: PayloadAction<{project: Partial<RecentProject> | SampleProject}>,
  ) {
    state.loading = true;
  },

  /**
   * Set the project success state
   * @param action.project the payload with the project data
   */
  openProjectSuccess(
    state: ProjectState,
    action: PayloadAction<{project: IOpenPayload}>,
  ) {
    let currentClipId = action.payload.project.groups?.[0]?.clips?.[0];
    if (action.payload.project.lastOpenedClipId) {
      currentClipId = action.payload.project.lastOpenedClipId;
    }

    const groups =
      action.payload.project.groups && action.payload.project.groups.length > 0
        ? action.payload.project.groups
        : (action.payload.project.clips as any[]).map((c: any) => {
            return {
              id: uuidv4(),
              name: c.name,
              isFolder: false,
              clips: [c.clipId],
            };
          });

    const clips: Record<string, Clip> = {};
    (action.payload.project.clips as any[]).forEach((c: any) => {
      const dsp =
        Object.keys(c.settings).length > 0
          ? unpackDspSettings(c.settings)
          : defaultDspSettings();

      clips[c.clipId] = {
        name: c.name,
        loading: false,
        failed: false,
        error: undefined,
        audio: c.audio,
        hasChanges: {
          amplitude: false,
          frequency: false,
        },
        svg: c.svg,
        timeline: timelineFor(c.haptic),
        playhead: 0,
        notes: c.notes,
        markers: c.markers,
        trimAt: c.trimAt,
        state: {
          present: {
            revision: 0,
            haptic: c.haptic,
            dsp,
            selectedPoints: [],
            selectedEmphasis: undefined,
          },
          past: [],
          future: [],
        },
      };
      if (clips[c.clipId].trimAt) {
        clips[c.clipId].timeline!.endTime = Math.min(
          clips[c.clipId].timeline!.endTime,
          clips[c.clipId].trimAt!,
        );
      }
    });
    return {
      ...state,
      clips,
      loading: false,
      sessionId: action.payload.project.sessionId,
      groups,
      currentClipId,
      selection: {
        clips: currentClipId ? [currentClipId] : [],
        groups: [],
        lastSelected: currentClipId,
      },
      name: action.payload.project.name,
      category: action.payload.project.category,
      version: action.payload.project.version,
      description: action.payload.project.description,
      slug: action.payload.project.slug,
      isOpen: true,
      isSample: action.payload.project.isSample,
      isTutorial: action.payload.project.isTutorial,
      isAuthoringTutorial: action.payload.project.isAuthoringTutorial,
    };
  },

  /**
   * Set the project open failure state
   * @param action.error the error message
   */
  openProjectFailure(
    _state: ProjectState,
    _action: PayloadAction<{error: string}>,
  ) {},

  /**
   * Load the current project, if any was open when the user closed the app
   */
  loadCurrentProject(_state: ProjectState) {},

  /**
   * Update the project info
   * @param action.name the project name
   */
  projectInfo(
    state: ProjectState,
    action: PayloadAction<{
      name: string;
      isTutorial?: boolean;
      isAuthoringTutorial?: boolean;
      isSampleProject?: boolean;
    }>,
  ) {
    state.name = action.payload.name;
    state.isTutorial = action.payload.isTutorial ?? state.isTutorial;
    state.isAuthoringTutorial =
      action.payload.isAuthoringTutorial ?? state.isAuthoringTutorial;
    state.isSample = action.payload.isSampleProject ?? state.isSample;
    state.isOpen = true;
  },

  /**
   * Close the current project
   */
  closeProject(state: ProjectState) {
    state.loading = false;
    state.sessionId = initialState.sessionId;
    state.groups = [];
    state.name = undefined;
    state.isOpen = false;
    state.isTutorial = false;
    state.isAuthoringTutorial = false;
    state.clips = {};
    state.isTrimmingCurrentClip = false;
  },

  /**
   * Sync groups with the project file
   * @param action.groups the groups
   */
  syncGroups(
    _state: ProjectState,
    _action: PayloadAction<{groups: ClipGroup[]}>,
  ) {},

  /**
   * Update the project metadata
   * @param action.metadata the project updated metadata
   */
  updateMetadata(
    state: ProjectState,
    action: PayloadAction<{metadata: ProjectMetadata}>,
  ) {
    state.description =
      action.payload.metadata.description ?? state.description;
    state.slug = action.payload.metadata.slug ?? state.slug;
    state.category = action.payload.metadata.category ?? state.category;
    state.version = action.payload.metadata.version ?? state.version;
  },

  /** IPC: Open a system folder at the given path */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  openSystemFolder(
    _state: ProjectState,
    _action: PayloadAction<{path: string}>,
  ) {},

  /** IPC: Request paste from the main process */
  requestPaste() {},

  /** IPC: Request closing the current project */
  closeCurrentProject() {},

  /** IPC: Request renaming the current project */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  renameProject(
    _state: ProjectState,
    _action: PayloadAction<{name: string}>,
  ) {},

  /** IPC: Request asset relocation for a clip */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  requestRelocateAsset(
    _state: ProjectState,
    _action: PayloadAction<{clipId: string}>,
  ) {},

  /** IPC: Request adding audio to a clip */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  requestAddAudioToClip(
    _state: ProjectState,
    _action: PayloadAction<{clipId: string}>,
  ) {},

  /** IPC: Request adding files via system file dialog */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  requestAddFiles(
    _state: ProjectState,
    _action: PayloadAction<{properties?: string[]}>,
  ) {},
};
