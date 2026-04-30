/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createListenerMiddleware} from '@reduxjs/toolkit';

import appSlice from '../app/slice';
import {IpcInvokeChannel, IpcSendChannel} from '../../../../shared';
import type {ExportFormat} from '../../../../shared/ipc-types';
import {typedInvoke, typedSend} from '../../../../shared/typed-ipc';
import type {RecentProject, SampleProject} from '../types';

type ListenerMiddleware = ReturnType<typeof createListenerMiddleware>;

export function registerAppListeners(
  listenerMiddleware: ListenerMiddleware,
): void {
  listenerMiddleware.startListening({
    actionCreator: appSlice.actions.updateTermsAndConditionsApprove,
    effect: action => {
      void typedInvoke(IpcInvokeChannel.TermsAndConditions, {
        termsAccepted: action.payload.termsAccepted,
      });
    },
  });

  listenerMiddleware.startListening({
    actionCreator: appSlice.actions.fetchRecents,
    effect: async (action, listenerApi) => {
      const res = await typedInvoke(IpcInvokeChannel.RecentProjects);

      if (res.status === 'ok' && res.payload) {
        listenerApi.dispatch(
          appSlice.actions.fetchRecentsSuccess({
            recentProjects: res.payload.projects as unknown as RecentProject[],
          }),
        );
      } else {
        listenerApi.dispatch(
          appSlice.actions.fetchRecentsFailure({error: res.message ?? ''}),
        );
      }
    },
  });

  listenerMiddleware.startListening({
    actionCreator: appSlice.actions.loadSamples,
    effect: async (action, listenerApi) => {
      const res = await typedInvoke(IpcInvokeChannel.Samples);

      if (res.status === 'ok' && res.payload) {
        listenerApi.dispatch(
          appSlice.actions.loadSamplesSuccess({
            sampleProjects: res.payload.samples as unknown as SampleProject[],
          }),
        );
      } else {
        listenerApi.dispatch(
          appSlice.actions.loadSamplesFailure({error: res.message ?? ''}),
        );
      }
    },
  });

  listenerMiddleware.startListening({
    actionCreator: appSlice.actions.confirmExport,
    effect: async (action, listenerApi) => {
      listenerApi.dispatch(
        appSlice.actions.updateExportDialog({status: 'pending'}),
      );

      const response = await typedInvoke(IpcInvokeChannel.ExportClips, {
        clips: action.payload.clips,
        formats: action.payload.formats as ExportFormat[],
        packageProject: action.payload.packageProject,
        flatten: action.payload.flatten,
        gain: action.payload.gain,
        sampleRate: action.payload.sampleRate,
      });
      if (response.status === 'ok') {
        listenerApi.dispatch(
          appSlice.actions.updateExportDialog({status: 'success'}),
        );
      }
    },
  });

  listenerMiddleware.startListening({
    actionCreator: appSlice.actions.toggleDefaultControls,
    effect: async action => {
      await typedInvoke(IpcInvokeChannel.ToggleDefaultControls, {
        enabled: action.payload.enabled,
      });
    },
  });

  listenerMiddleware.startListening({
    actionCreator: appSlice.actions.toggleMenuItems,
    effect: async action => {
      await typedInvoke(
        IpcInvokeChannel.ToggleMenuItems,
        action.payload as Record<string, boolean>,
      );
    },
  });

  listenerMiddleware.startListening({
    actionCreator: appSlice.actions.requestWSAuthCode,
    effect: async () => {
      await typedInvoke(IpcInvokeChannel.WsAuthCodeRequest);
    },
  });

  listenerMiddleware.startListening({
    actionCreator: appSlice.actions.disconnectWSDevice,
    effect: async action => {
      await typedInvoke(IpcInvokeChannel.DisconnectDevice, {
        deviceId: action.payload.deviceId,
      });
    },
  });

  listenerMiddleware.startListening({
    actionCreator: appSlice.actions.getTelemetryState,
    effect: async (action, listenerApi) => {
      const res = await typedInvoke(IpcInvokeChannel.TelemetryConsentState);

      if (res.status === 'ok' && res.payload) {
        listenerApi.dispatch(
          appSlice.actions.setTelemetryState({...res.payload}),
        );
      }
    },
  });

  // --- Fire-and-forget IPC listeners ---

  listenerMiddleware.startListening({
    actionCreator: appSlice.actions.quitApplication,
    effect: () => {
      typedSend(IpcSendChannel.QuitApplication);
    },
  });

  listenerMiddleware.startListening({
    actionCreator: appSlice.actions.downloadUpdate,
    effect: async () => {
      await typedInvoke(IpcInvokeChannel.DownloadUpdate);
    },
  });

  listenerMiddleware.startListening({
    actionCreator: appSlice.actions.quitAndInstall,
    effect: async () => {
      await typedInvoke(IpcInvokeChannel.QuitAndInstall);
    },
  });

  listenerMiddleware.startListening({
    actionCreator: appSlice.actions.requestDevicesStatus,
    effect: async () => {
      await typedInvoke(IpcInvokeChannel.DevicesStatusRequest);
    },
  });

  listenerMiddleware.startListening({
    actionCreator: appSlice.actions.openExportFolder,
    effect: () => {
      typedSend(IpcSendChannel.OpenExportFolder);
    },
  });

  listenerMiddleware.startListening({
    actionCreator: appSlice.actions.reportFrontendError,
    effect: async action => {
      await typedInvoke(IpcInvokeChannel.FrontendErrorRaised, {
        name: 'FrontendError',
        message: action.payload.error,
        stack: action.payload.componentStack ?? '',
      });
    },
  });

  listenerMiddleware.startListening({
    actionCreator: appSlice.actions.toggleEmphasisMenu,
    effect: async action => {
      await typedInvoke(IpcInvokeChannel.ToggleEmphasis, {
        checked: action.payload.checked,
        enabled: action.payload.enabled,
      });
    },
  });

  listenerMiddleware.startListening({
    actionCreator: appSlice.actions.toggleCopyMenu,
    effect: async action => {
      await typedInvoke(IpcInvokeChannel.ToggleCopy, {
        enabled: action.payload.enabled,
      });
    },
  });

  listenerMiddleware.startListening({
    actionCreator: appSlice.actions.openProjectFromBrowser,
    effect: async () => {
      await typedInvoke(IpcInvokeChannel.OpenProject);
    },
  });

  listenerMiddleware.startListening({
    actionCreator: appSlice.actions.sendAnalyticsMessage,
    effect: async action => {
      await typedInvoke(IpcInvokeChannel.FrontendAnalyticsMessage, {
        activity: action.payload.activity,
        message: action.payload.message ?? {},
      });
    },
  });

  listenerMiddleware.startListening({
    actionCreator: appSlice.actions.saveTelemetryConsent,
    effect: async (action, listenerApi) => {
      const response = await typedInvoke(
        IpcInvokeChannel.TelemetrySaveConsentState,
        {consent: action.payload.consent},
      );
      if (response?.payload) {
        listenerApi.dispatch(
          appSlice.actions.setTelemetryState(response.payload),
        );
      }
    },
  });

  listenerMiddleware.startListening({
    actionCreator: appSlice.actions.setTelemetryConsentNotificationShown,
    effect: async (action, listenerApi) => {
      const response = await typedInvoke(
        IpcInvokeChannel.TelemetrySetConsentNotificationShown,
      );
      if (response?.payload) {
        listenerApi.dispatch(
          appSlice.actions.setTelemetryState(response.payload),
        );
      }
    },
  });
}
