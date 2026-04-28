/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * CRUD-related clip handlers
 */

import {IpcInvokeChannel} from '../../../../shared';
import {createIPCHandler} from '../ipcHandlerUtils';
import {PostActionPresets} from '../ipcHandlerUtils';

import Project, {ClipMarker} from '../../common/project';
import {setCurrentClip as setCurrentClipAction} from '../../actions/project';
import WSServer from '../../wsServer';
// @oss-disable

/**
 * Set a specific clip as the current one
 */
export function setCurrentClip(): void {
  createIPCHandler<{clipId: string}>(IpcInvokeChannel.SetCurrentClip, args => {
    setCurrentClipAction(args.clipId);
    // Send Current clip to the HMD
    WSServer.instance.sendCurrentClip();
  });
}

/**
 * Remove a clip from the project
 */
export function deleteClips(): void {
  createIPCHandler<{clipIds: string[]}>(
    IpcInvokeChannel.DeleteClips,
    args => {
      const {clipIds = []} = args;
      for (const clipId of clipIds) {
        Project.instance.deleteClip(clipId);
        // if we are deleting the current clip, also clear the audio file cache
        if (clipId === Project.instance.getCurrentClip()?.clipId) {
          Project.instance.clearCurrentAudio();
        }
      }
    },
    {sendWSProject: true},
  );
}

/**
 * Update a clip name
 */
export function updateClipName(): void {
  createIPCHandler<{clipId: string; name: string}>(
    IpcInvokeChannel.UpdateClipName,
    args => {
      const {clipId, name} = args;
      const clip = Project.instance.getClipById(clipId);
      if (clip) {
        Project.instance.updateClip(clipId, {...clip, name});
      }
    },
    PostActionPresets.clipModification,
  );
}

/**
 * Update the clips' tutorial notes
 */
export function updateNotes(): void {
  createIPCHandler<{clipId: string; notes: string}>(
    IpcInvokeChannel.UpdateNotes,
    args => {
      const {clipId, notes} = args;
      const clip = Project.instance.getClipById(clipId);
      if (clip) {
        clip.notes = notes;
        Project.instance.updateClip(clipId, clip);
      }
    },
    {markDirty: true, reloadMenu: true},
  );
}

/**
 * Update the clips' markers
 */
export function updateMarkers(): void {
  createIPCHandler<{clipId: string; markers: ClipMarker[]}>(
    IpcInvokeChannel.UpdateMarkers,
    args => {
      const {clipId, markers = []} = args;
      const clip = Project.instance.getClipById(clipId);
      if (clip) {
        clip.markers = markers;
        Project.instance.updateClip(clipId, clip);
      }
    },
    PostActionPresets.clipUpdate,
  );
}

/**
 * Update the trim marker for a single clip
 */
export function updateTrimMarker(): void {
  createIPCHandler<{clipId: string; trim: number}>(
    IpcInvokeChannel.UpdateTrim,
    args => {
      const {clipId, trim} = args;
      const clip = Project.instance.getClipById(clipId);
      if (clip) {
        clip.trimAt = trim;
        Project.instance.updateClip(clipId, clip);
        if (trim) {
          // @oss-disable
        }
      }
    },
    {markDirty: true},
  );
}

/**
 * Update the playhead position for a single clip
 */
export function updatePlayhead(): void {
  createIPCHandler<{clipId: string; playhead: number}>(
    IpcInvokeChannel.UpdatePlayhead,
    args => {
      const {clipId, playhead} = args;
      const clip = Project.instance.getClipById(clipId);
      if (clip) {
        clip.playhead = playhead;
        Project.instance.updateClip(clipId, clip);
      }
    },
    PostActionPresets.clipUpdate,
  );
}

/**
 * Duplicate clips in the current project
 */
export function duplicateClips(): void {
  createIPCHandler<{
    clips: {originalClipId: string; clipId: string; name: string}[];
  }>(
    IpcInvokeChannel.DuplicateClips,
    args => {
      const {clips = []} = args;
      for (const clip of clips) {
        const {originalClipId, clipId, name} = clip;
        Project.instance.duplicateClip(originalClipId, clipId, name);
      }
    },
    PostActionPresets.clipModification,
  );
}

/**
 * Bind CRUD-related IPC handlers
 */
export default function bindCrudHandlers(): void {
  setCurrentClip();
  deleteClips();
  updateClipName();
  updateNotes();
  updateMarkers();
  updateTrimMarker();
  updatePlayhead();
  duplicateClips();
}
