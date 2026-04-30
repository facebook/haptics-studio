/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createListenerMiddleware, isAnyOf} from '@reduxjs/toolkit';

import {defaultDspSettings, packDspSettings} from '../dsp';
import {IpcInvokeChannel, IpcSendChannel} from '../../../../shared';
import type {AddFilesRequest} from '../../../../shared/ipc-types';
import {typedInvoke, typedSend} from '../../../../shared/typed-ipc';
import appSlice from '../app/slice';
import projectSlice from '../project/slice';
import editingToolsSlice from '../editingTools/slice';
import {
  duplicatedClipsAndGroups,
  envelopesFromSelection,
  pastedEmphasisEnvelope,
} from '../../globals/utils';
import {AnalysisRequest, EnvelopeType, FocusArea, SnackbarType} from '../types';
import {RootState} from '../store';

type ListenerMiddleware = ReturnType<typeof createListenerMiddleware>;

export function registerProjectListeners(
  listenerMiddleware: ListenerMiddleware,
): void {
  listenerMiddleware.startListening({
    actionCreator: projectSlice.actions.analyzeFiles,
    effect: action => {
      const packedSettings = packDspSettings(action.payload.settings);

      const audioFiles: AnalysisRequest = {};
      const hapticFiles: AnalysisRequest = {};

      Object.keys(action.payload.data).forEach(k => {
        if (action.payload.data[k].path.endsWith('.haptic')) {
          hapticFiles[k] = action.payload.data[k];
        } else {
          audioFiles[k] = action.payload.data[k];
        }
      });

      if (Object.keys(audioFiles).length > 0) {
        typedSend(IpcSendChannel.AudioAnalysis, {
          files: Object.keys(audioFiles).map(k => {
            return {
              clipId: k,
              path: audioFiles[k].path,
              settings: packedSettings,
            };
          }),
          silent: action.payload.silent,
        });
      }

      if (Object.keys(hapticFiles).length > 0) {
        typedSend(IpcSendChannel.ImportHaptics, {
          files: Object.keys(hapticFiles).map(k => {
            return {
              clipId: k,
              path: hapticFiles[k].path,
            };
          }),
        });
      }
    },
  });

  listenerMiddleware.startListening({
    actionCreator: projectSlice.actions.retryAudioAnalysis,
    effect: action => {
      const packedSettings = packDspSettings(action.payload.settings);

      typedSend(IpcSendChannel.RetryAudioAnalysis, {
        clipId: action.payload.clipId,
        settings: packedSettings,
      });
    },
  });

  listenerMiddleware.startListening({
    actionCreator: projectSlice.actions.updateAudioAnalysis,
    effect: (action, listenerApi) => {
      const {clips} = (listenerApi.getOriginalState() as RootState).project;
      const clip = clips[action.payload.clipId];

      const newSettings = {
        ...clip.state.present.dsp,
        ...action.payload.settingsChange,
      };

      const packedSettings = packDspSettings(newSettings);

      typedSend(IpcSendChannel.UpdateAudioAnalysis, {
        clipId: action.payload.clipId,
        settings: packedSettings,
        group: action.payload.group as 'amplitude' | 'frequency',
      });

      listenerApi.dispatch(
        appSlice.actions.setSelectedEnvelope({
          envelope:
            action.payload.group === 'frequency'
              ? EnvelopeType.Frequency
              : EnvelopeType.Amplitude,
        }),
      );
    },
  });

  listenerMiddleware.startListening({
    actionCreator: projectSlice.actions.batchAudioAnalysis,
    effect: (action, listenerApi) => {
      action.payload.clipIds.forEach(clipId => {
        listenerApi.dispatch(
          projectSlice.actions.updateAudioAnalysis({
            clipId,
            settingsChange: action.payload.settingsChange,
            group: action.payload.group,
          }),
        );
      });
      // @oss-disable
      // @oss-disable
        // @oss-disable
        // @oss-disable
          // @oss-disable
        // @oss-disable
      // @oss-disable
    },
  });

  listenerMiddleware.startListening({
    actionCreator: projectSlice.actions.openProject,
    effect: async (action, listenerApi) => {
      const res = await typedInvoke(
        IpcInvokeChannel.Open,
        action.payload.project,
      );
      if (res.status === 'ok' && res.payload) {
        typedSend(IpcSendChannel.LoadProjectSuccess, {
          projectExists: res.payload.projectExists,
        });

        listenerApi.dispatch(
          projectSlice.actions.openProjectSuccess({project: res.payload}),
        );
      } else {
        listenerApi.dispatch(
          projectSlice.actions.openProjectFailure({error: res.message ?? ''}),
        );
      }
    },
  });

  listenerMiddleware.startListening({
    actionCreator: projectSlice.actions.loadCurrentProject,
    effect: async (action, listenerApi) => {
      const res = await typedInvoke(IpcInvokeChannel.LoadCurrentProject);
      if (
        res.status === 'ok' &&
        res.payload &&
        Object.keys(res.payload).length > 0
      ) {
        listenerApi.dispatch(
          projectSlice.actions.openProjectSuccess({project: res.payload}),
        );
      } else if (res.message) {
        listenerApi.dispatch(
          projectSlice.actions.openProjectFailure({error: res.message}),
        );
      }
    },
  });

  listenerMiddleware.startListening({
    actionCreator: projectSlice.actions.openProjectSuccess,
    effect: action => {
      typedSend(IpcSendChannel.LoadProjectSuccess, {
        projectExists: action.payload.project.projectExists,
      });
    },
  });

  listenerMiddleware.startListening({
    actionCreator: projectSlice.actions.renameClip,
    effect: async action => {
      await typedInvoke(IpcInvokeChannel.UpdateClipName, {
        clipId: action.payload.clipId,
        name: action.payload.name,
      });
    },
  });

  listenerMiddleware.startListening({
    actionCreator: projectSlice.actions.updateTutorialNotes,
    effect: async action => {
      await typedInvoke(IpcInvokeChannel.UpdateNotes, {
        clipId: action.payload.clipId,
        notes: action.payload.notes,
      });
    },
  });

  listenerMiddleware.startListening({
    actionCreator: projectSlice.actions.updateMetadata,
    effect: async action => {
      await typedInvoke(
        IpcInvokeChannel.UpdateMetadata,
        action.payload.metadata,
      );
    },
  });

  listenerMiddleware.startListening({
    actionCreator: projectSlice.actions.updateHaptic,
    effect: async (action, listenerApi) => {
      const params = {
        clipId: action.payload.clipId,
        haptic: action.payload.haptic,
      };

      const res = await typedInvoke(IpcInvokeChannel.HapticUpdate, params);

      if (res.status !== 'ok') {
        // eslint-disable-next-line no-console
        console.warn(res.message);
        listenerApi.dispatch(
          projectSlice.actions.updateHapticFailure({
            clipId: action.payload.clipId,
            error: res.message ?? '',
          }),
        );
      }
    },
  });

  listenerMiddleware.startListening({
    actionCreator: projectSlice.actions.updateHapticFailure,
    effect: (action, listenerApi) => {
      listenerApi.dispatch(
        projectSlice.actions.undo({clipId: action.payload.clipId}),
      );
    },
  });

  listenerMiddleware.startListening({
    actionCreator: projectSlice.actions.copySelectedPoints,
    effect: async (action, listenerApi) => {
      const {clips, currentClipId} = (listenerApi.getState() as RootState)
        .project;
      const clipId = action.payload.clipId ?? currentClipId;
      if (!clipId) return;
      const clip = clips[clipId];
      const envelopeType = (listenerApi.getState() as RootState).app.visibility
        .envelope;
      if (clip && clip.state.present.haptic) {
        const envelopes = envelopesFromSelection(
          clip.state.present.haptic.signals.continuous.envelopes,
          envelopeType,
          clip.state.present.selectedPoints,
        );
        if (envelopes) {
          const {amplitude, frequency, range} = envelopes;

          if (amplitude.length > 0 || frequency.length > 0) {
            await typedInvoke(IpcInvokeChannel.Copy, {
              payload: {amplitude, frequency},
            });

            if (action.payload.cut) {
              listenerApi.dispatch(
                projectSlice.actions.deletePointRange({
                  clipId,
                  envelopes: [EnvelopeType.Amplitude, EnvelopeType.Frequency],
                  range,
                }),
              );
            }
          }
        }
      }
    },
  });

  listenerMiddleware.startListening({
    actionCreator: projectSlice.actions.pastePointsInPlace,
    effect: (action, listenerApi) => {
      const {clips, currentClipId} = (listenerApi.getState() as RootState)
        .project;
      const clipId = action.payload.clipId ?? currentClipId;
      if (!clipId) return;
      const clip = clips[clipId];
      if (clip) {
        const current =
          clip.state.present.haptic?.signals.continuous.envelopes.amplitude ||
          [];
        if (
          action.payload.points &&
          (action.payload.points.amplitude.length > 0 ||
            action.payload.points.frequency.length > 0) &&
          current.length > 0
        ) {
          listenerApi.dispatch(
            projectSlice.actions.confirmPaste({
              clipId,
              clipboard: action.payload.points,
              inPlace: true,
              offset: 0,
            }),
          );
        }
      }
    },
  });

  listenerMiddleware.startListening({
    actionCreator: projectSlice.actions.pasteEmphasisInPlace,
    effect: (action, listenerApi) => {
      const {clips, currentClipId} = (
        listenerApi.getOriginalState() as RootState
      ).project;
      const clipId = action.payload.clipId ?? currentClipId;
      if (!clipId) return;
      const clip = clips[clipId];
      if (!clip) return;

      const {amplitude, skippedCount} = pastedEmphasisEnvelope(
        clip,
        action.payload.points,
      );

      if (amplitude) {
        listenerApi.dispatch(
          projectSlice.actions.confirmPasteEmphasis({clipId, amplitude}),
        );
      }

      if (skippedCount > 0) {
        listenerApi.dispatch(
          appSlice.actions.showSnackbar({
            textKey: 'editor.paste-emphasis-skipped',
            snackbarType: SnackbarType.Info,
            autoDismiss: true,
          }),
        );
      }
    },
  });

  listenerMiddleware.startListening({
    actionCreator: projectSlice.actions.switchClip,
    effect: async (action, listenerApi) => {
      const {clips} = (listenerApi.getOriginalState() as RootState).project;
      if (clips[action.payload.clipId]) {
        await typedInvoke(IpcInvokeChannel.SetCurrentClip, {
          clipId: action.payload.clipId,
        });
      }
    },
  });

  listenerMiddleware.startListening({
    actionCreator: projectSlice.actions.syncGroups,
    effect: (_action, listenerApi) => {
      const {groups} = (listenerApi.getOriginalState() as RootState).project;
      void typedInvoke(IpcInvokeChannel.UpdateGroups, groups);
    },
  });

  listenerMiddleware.startListening({
    matcher: isAnyOf(
      projectSlice.actions.createMarker,
      projectSlice.actions.updateMarker,
      projectSlice.actions.deleteMarker,
    ),
    effect: async (action, listenerApi) => {
      const clipId =
        action.payload.clipId ??
        (listenerApi.getOriginalState() as RootState).project.currentClipId;
      const previous = (listenerApi.getOriginalState() as RootState).project
        .clips[clipId].markers;
      const {markers} = (listenerApi.getState() as RootState).project.clips[
        clipId
      ];

      const params = {
        clipId,
        markers,
      };
      const res = await typedInvoke(IpcInvokeChannel.UpdateMarkers, params);

      if (res.status !== 'ok') {
        listenerApi.dispatch(
          projectSlice.actions.updateMarkerFailure({clipId, previous}),
        );
      }
    },
  });

  listenerMiddleware.startListening({
    actionCreator: projectSlice.actions.setPlayhead,
    effect: async (action, listenerApi) => {
      const clipId =
        action.payload.clipId ??
        (listenerApi.getOriginalState() as RootState).project.currentClipId;
      const previous = (listenerApi.getOriginalState() as RootState).project
        .clips[clipId].playhead;
      const {playhead} = (listenerApi.getState() as RootState).project.clips[
        clipId
      ];

      const params = {
        clipId,
        playhead,
      };
      const res = await typedInvoke(IpcInvokeChannel.UpdatePlayhead, params);

      if (res.status !== 'ok') {
        listenerApi.dispatch(
          projectSlice.actions.setPlayheadFailure({clipId, previous}),
        );
      }
    },
  });

  listenerMiddleware.startListening({
    actionCreator: projectSlice.actions.duplicateSelectedClip,
    effect: async (_action, listenerApi) => {
      const {selection} = (listenerApi.getOriginalState() as RootState).project;
      const {groups, clips, duplicatedClips, duplicatedGroups} =
        duplicatedClipsAndGroups(
          selection,
          (listenerApi.getOriginalState() as RootState).project.groups,
          (listenerApi.getOriginalState() as RootState).project.clips,
        );

      await typedInvoke(IpcInvokeChannel.UpdateGroups, groups);
      await typedInvoke(IpcInvokeChannel.DuplicateClips, {
        clips: duplicatedClips,
      });

      const newCurrent = duplicatedClips.find(
        d => d.originalClipId === selection.lastSelected,
      );

      listenerApi.dispatch(
        projectSlice.actions.addDuplicatedClips({groups, clips}),
      );
      listenerApi.dispatch(
        projectSlice.actions.setSelection({
          clips: duplicatedClips.map(d => d.clipId),
          groups: duplicatedGroups,
          lastSelected: newCurrent?.clipId,
        }),
      );
    },
  });

  listenerMiddleware.startListening({
    actionCreator: projectSlice.actions.deleteClips,
    effect: async action => {
      await typedInvoke(IpcInvokeChannel.DeleteClips, {
        clipIds: action.payload.clipIds,
      });
    },
  });

  listenerMiddleware.startListening({
    actionCreator: projectSlice.actions.splitStereoAudio,
    effect: (action, listenerApi) => {
      const {clips} = (listenerApi.getOriginalState() as RootState).project;
      const originalClip = clips[action.payload.clipId];
      if (!originalClip.audio) return;

      const channels = [
        {
          clipId: action.payload.leftId,
          name: `${originalClip.name}_L`,
        },
        {
          clipId: action.payload.rightId,
          name: `${originalClip.name}_R`,
        },
      ];
      const request = {
        clipId: action.payload.clipId,
        channels,
        settings: packDspSettings(originalClip.state.present.dsp),
      };
      typedSend(IpcSendChannel.SplitStereoClip, request);
    },
  });

  listenerMiddleware.startListening({
    actionCreator: projectSlice.actions.createEmptyClip,
    effect: (action, listenerApi) => {
      typedSend(IpcSendChannel.CreateEmptyClip, {
        clipId: action.payload.clipId,
        name: action.payload.name,
      });
      const {visibility} = (listenerApi.getOriginalState() as RootState).app;
      listenerApi.dispatch(
        editingToolsSlice.actions.enablePen({
          clipId: action.payload.clipId,
          envelope: visibility.envelope,
        }),
      );
    },
  });

  listenerMiddleware.startListening({
    actionCreator: projectSlice.actions.selectAll,
    effect: (action, listenerApi) => {
      const {focus, visibility} = (listenerApi.getOriginalState() as RootState)
        .app;

      switch (focus) {
        case FocusArea.Navigator: {
          listenerApi.dispatch(projectSlice.actions.selectAllClips());
          break;
        }
        case FocusArea.Plot: {
          listenerApi.dispatch(
            projectSlice.actions.selectAllPoints({
              envelope: visibility.envelope,
            }),
          );
          break;
        }
        default:
          break;
      }
    },
  });

  // --- Project-level IPC listeners ---

  listenerMiddleware.startListening({
    actionCreator: projectSlice.actions.openSystemFolder,
    effect: action => {
      typedSend(IpcSendChannel.OpenSystemFolderAt, {
        path: action.payload.path,
      });
    },
  });

  listenerMiddleware.startListening({
    actionCreator: projectSlice.actions.requestPaste,
    effect: () => {
      typedSend(IpcSendChannel.Paste);
    },
  });

  listenerMiddleware.startListening({
    actionCreator: projectSlice.actions.closeCurrentProject,
    effect: async () => {
      await typedInvoke(IpcInvokeChannel.CloseCurrentProject);
    },
  });

  listenerMiddleware.startListening({
    actionCreator: projectSlice.actions.renameProject,
    effect: async (action, listenerApi) => {
      const response = await typedInvoke(IpcInvokeChannel.RenameProject, {
        name: action.payload.name,
      });
      if (response && response.status === 'ok') {
        listenerApi.dispatch(
          projectSlice.actions.projectInfo({name: action.payload.name}),
        );
      }
    },
  });

  listenerMiddleware.startListening({
    actionCreator: projectSlice.actions.requestRelocateAsset,
    effect: async (action, listenerApi) => {
      const res = await typedInvoke(IpcInvokeChannel.RelocateAsset, {
        clipId: action.payload.clipId,
      });
      if (res && res.status === 'ok' && res.payload) {
        const {clipId, audioAsset} = res.payload;
        listenerApi.dispatch(
          projectSlice.actions.relocateAsset({clipId, audio: audioAsset}),
        );
      }
    },
  });

  listenerMiddleware.startListening({
    actionCreator: projectSlice.actions.requestAddAudioToClip,
    effect: async (action, listenerApi) => {
      const res = await typedInvoke(IpcInvokeChannel.AddAudioToClip, {
        clipId: action.payload.clipId,
      });
      if (res && res.status === 'ok' && res.payload) {
        const {clipId, audioAsset, waveform} = res.payload;
        listenerApi.dispatch(
          projectSlice.actions.addAudioToClip({
            clipId,
            audio: audioAsset,
            waveform,
          }),
        );
      }
    },
  });

  listenerMiddleware.startListening({
    actionCreator: projectSlice.actions.requestAddFiles,
    effect: async (action, listenerApi) => {
      const res = await typedInvoke(IpcInvokeChannel.AddFiles, {
        properties: action.payload.properties as AddFilesRequest['properties'],
      });
      if (res && res.status === 'ok' && res.payload) {
        const {files} = res.payload as {files?: File[]};
        if (files) {
          listenerApi.dispatch(
            projectSlice.actions.analyzeFiles({
              files,
              settings: defaultDspSettings(),
            }),
          );
        }
      }
    },
  });
}
