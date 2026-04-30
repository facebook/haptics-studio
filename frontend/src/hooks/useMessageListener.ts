/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {useDispatch, useStore} from 'react-redux';
import {useContext, useEffect} from 'react';
import {AppContext} from '../containers/App';
import {analyzeFiles} from '../globals/utils';
import {MainToRenderer} from '../../../shared';
import {typedOn} from '../../../shared/typed-ipc';

import {EnvelopeType, SnackbarType} from '../state/types';
import {defaultDspSettings} from '../state/dsp';
import {RootState} from '../state/store';

const useMessageListener = (): void => {
  const {actions, lang} = useContext(AppContext);
  const dispatch = useDispatch();
  const store = useStore<RootState>();

  useEffect(() => {
    const cleanups: Array<() => void> = [];

    const onError = (_event: Electron.IpcRendererEvent, args: any) => {
      dispatch(
        actions.app.showSnackbar({
          text: args.message,
          snackbarType: SnackbarType.Error,
          autoDismiss: true,
          action: undefined,
        }),
      );
    };

    const onClose = () => {
      dispatch(actions.project.closeProject());
      dispatch(actions.app.fetchRecents());
    };

    const onProjectInfo = (
      _event: Electron.IpcRendererEvent,
      response: any,
    ) => {
      dispatch(
        actions.project.projectInfo({
          name: response.payload.name,
          isTutorial: response.payload.isTutorial,
          isSampleProject: response.payload.isSampleProject,
          isAuthoringTutorial: response.payload.isAuthoringTutorial,
        }),
      );
    };

    const onSetCurrentClip = (
      _event: Electron.IpcRendererEvent,
      response: any,
    ) => {
      dispatch(actions.project.setCurrentClip({id: response.clipId}));
    };

    const onSelectAll = () => {
      dispatch(actions.project.selectAll());
    };

    const onUndo = () => {
      dispatch(actions.project.undo({}));
    };

    const onRedo = () => {
      dispatch(actions.project.redo({}));
    };

    const onEmphasis = () => {
      const {envelope} = store.getState().app.visibility;
      if (envelope !== EnvelopeType.Amplitude) return;
      dispatch(actions.project.toggleEmphasisOnSelectedPoints({}));
    };

    const onCopy = () => {
      dispatch(actions.project.copySelectedPoints({cut: false}));
    };

    const onCut = () => {
      dispatch(actions.project.copySelectedPoints({cut: true}));
    };

    const onPaste = (_event: Electron.IpcRendererEvent, response: any) => {
      dispatch(actions.project.pastePoints({clipboard: response.payload}));
    };

    const onPasteInPlace = (
      _event: Electron.IpcRendererEvent,
      response: any,
    ) => {
      dispatch(actions.project.pastePointsInPlace({points: response.payload}));
    };

    const onPasteEmphasisInPlace = (
      _event: Electron.IpcRendererEvent,
      response: any,
    ) => {
      dispatch(
        actions.project.pasteEmphasisInPlace({points: response.payload}),
      );
    };

    const onGroup = () => {
      dispatch(actions.project.groupSelectedClips());
    };

    const onUngroup = () => {
      dispatch(actions.project.ungroupSelectedClips());
    };

    const onAudioAnalysis = (_event: Electron.IpcRendererEvent, args: any) => {
      if (args.status && args.status === 'ok') {
        const {clipId, sessionId, haptic} = args.payload;

        if (sessionId && clipId) {
          dispatch(actions.project.setCurrentSession({clipId, sessionId}));
        }

        if (haptic) {
          dispatch(actions.project.analysisSuccess(args.payload));
        }
      } else {
        // eslint-disable-next-line no-lonely-if
        if (args.reason !== 'missing_audio_file' && args.clipId) {
          dispatch(
            actions.project.analysisFailure({
              clipId: args.clipId,
              error: args.message,
            }),
          );
        }
      }
    };

    const onUpdateAudioAnalysis = (
      _event: Electron.IpcRendererEvent,
      args: any,
    ) => {
      if (args.status && args.status === 'ok') {
        const {haptic} = args.payload;
        if (haptic) {
          dispatch(actions.project.analysisUpdateSuccess(args.payload));
        }
      } else {
        // eslint-disable-next-line no-lonely-if
        if (args.reason !== 'missing_audio_file' && args.clipId) {
          dispatch(
            actions.project.analysisFailure({
              clipId: args.clipId,
              error: args.message,
            }),
          );
        }
      }
    };

    const onCurrentAnalysis = (
      _event: Electron.IpcRendererEvent,
      args: any,
    ) => {
      if (args.payload.clipId) {
        dispatch(
          actions.project.setCurrentAnalysis({clipId: args.payload.clipId}),
        );
      }
    };

    const onOpen = (_event: Electron.IpcRendererEvent, response: any) => {
      if (response.status === 'ok') {
        dispatch(
          actions.project.openProjectSuccess({project: response.payload}),
        );
      }
    };

    const onSaveAs = (_event: Electron.IpcRendererEvent, response: any) => {
      if (response.status === 'ok') {
        dispatch(
          actions.project.openProjectSuccess({project: response.payload}),
        );
      }
    };

    const onExportClipsResponse = (
      _event: Electron.IpcRendererEvent,
      response: any,
    ) => {
      if (response.status !== 'ok') {
        dispatch(
          actions.app.showSnackbar({
            text: response.message,
            snackbarType: SnackbarType.Error,
            autoDismiss: true,
            action: undefined,
          }),
        );
      }
    };

    const onMissingAudioFile = (
      _event: Electron.IpcRendererEvent,
      response: any,
    ) => {
      dispatch(actions.project.setMissingAsset({clipId: response.clipId}));
    };

    const onAddFiles = (_event: Electron.IpcRendererEvent, response: any) => {
      if (response.payload.files && response.payload.files.length > 0) {
        analyzeFiles(response.payload.files, dispatch, actions);
      }
    };

    const onWsAuthCode = (_event: Electron.IpcRendererEvent, response: any) => {
      dispatch(actions.app.setWSAuthCode({wsAuthCode: response.authCode}));
    };

    const onDevicesStatus = (
      _event: Electron.IpcRendererEvent,
      response: any,
    ) => {
      dispatch(actions.app.setConnectedDevices({connectedDevices: response}));
    };

    const onDeviceAuthRequest = () => {
      dispatch(actions.app.toggleDevicePanelState({open: true}));
    };

    const onWindowInfo = (_event: Electron.IpcRendererEvent, response: any) => {
      dispatch(
        actions.app.updateWindowInformation({windowInformation: response}),
      );
      if (response.flags) {
        Object.entries(response.flags).forEach(([key, value]) => {
          localStorage.setItem(`flags:${key}`, (value as boolean).toString());
        });
      }
    };

    const onTermsAndConditions = (
      _event: Electron.IpcRendererEvent,
      response: any,
    ) => {
      dispatch(
        actions.app.updateTermsAndConditionsApprove({
          termsAccepted: response.termsAccepted,
        }),
      );
    };

    const onUpdateAvailable = (
      _event: Electron.IpcRendererEvent,
      response: any,
    ) => {
      dispatch(actions.app.updateAvailable({updateInfo: response}));
    };

    const onUpdateDownloaded = () => {
      dispatch(actions.app.updateDownloaded());
    };

    const onDownloadProgress = (
      _event: Electron.IpcRendererEvent,
      response: any,
    ) => {
      dispatch(
        actions.app.updateDownloadProgress({progress: response.progress}),
      );
    };

    const onUpdateError = () => {
      dispatch(
        actions.app.showSnackbar({
          text: lang('updater.generic-error'),
          snackbarType: SnackbarType.Error,
          autoDismiss: true,
        }),
      );
      dispatch(actions.app.updateError());
    };

    const onImportHaptics = (
      _event: Electron.IpcRendererEvent,
      response: any,
    ) => {
      if (
        response.status === 'error' &&
        response.payload &&
        response.payload.clipId
      ) {
        dispatch(
          actions.project.deleteClips({clipIds: [response.payload.clipId]}),
        );
      }
    };

    const onTelemetryConsentState = (
      _event: Electron.IpcRendererEvent,
      response: any,
    ) => {
      dispatch(actions.app.setTelemetryState(response));
    };

    const onTelemetryConsentSettings = () => {
      dispatch(actions.app.showTelemetrySettingsDialog());
    };

    const onOpenHaptic = (_event: Electron.IpcRendererEvent, response: any) => {
      dispatch(
        actions.project.analyzeFiles({
          files: [{path: response.payload.path} as any as File],
          settings: defaultDspSettings(),
        }),
      );
    };

    cleanups.push(
      typedOn(MainToRenderer.Error, onError),
      typedOn(MainToRenderer.Close, onClose),
      typedOn(MainToRenderer.ProjectInfo, onProjectInfo),
      typedOn(MainToRenderer.SetCurrentClip, onSetCurrentClip),
      typedOn(MainToRenderer.SelectAll, onSelectAll),
      typedOn(MainToRenderer.Undo, onUndo),
      typedOn(MainToRenderer.Redo, onRedo),
      typedOn(MainToRenderer.Emphasis, onEmphasis),
      typedOn(MainToRenderer.Copy, onCopy),
      typedOn(MainToRenderer.Cut, onCut),
      typedOn(MainToRenderer.Paste, onPaste),
      typedOn(MainToRenderer.PasteInPlace, onPasteInPlace),
      typedOn(MainToRenderer.PasteEmphasisInPlace, onPasteEmphasisInPlace),
      typedOn(MainToRenderer.Group, onGroup),
      typedOn(MainToRenderer.Ungroup, onUngroup),
      typedOn(MainToRenderer.AudioAnalysis, onAudioAnalysis),
      typedOn(MainToRenderer.UpdateAudioAnalysis, onUpdateAudioAnalysis),
      typedOn(MainToRenderer.CurrentAnalysis, onCurrentAnalysis),
      typedOn(MainToRenderer.Open, onOpen),
      typedOn(MainToRenderer.SaveAs, onSaveAs),
      typedOn(MainToRenderer.ExportClipsResponse, onExportClipsResponse),
      typedOn(MainToRenderer.MissingAudioFile, onMissingAudioFile),
      typedOn(MainToRenderer.AddFiles, onAddFiles),
      typedOn(MainToRenderer.WsAuthCode, onWsAuthCode),
      typedOn(MainToRenderer.DevicesStatus, onDevicesStatus),
      typedOn(MainToRenderer.DeviceAuthRequest, onDeviceAuthRequest),
      typedOn(MainToRenderer.WindowInfo, onWindowInfo),
      typedOn(MainToRenderer.TermsAndConditions, onTermsAndConditions),
      typedOn(MainToRenderer.UpdateAvailable, onUpdateAvailable),
      typedOn(MainToRenderer.UpdateDownloaded, onUpdateDownloaded),
      typedOn(MainToRenderer.DownloadProgress, onDownloadProgress),
      typedOn(MainToRenderer.UpdateError, onUpdateError),
      typedOn(MainToRenderer.ImportHaptics, onImportHaptics),
      typedOn(MainToRenderer.TelemetryConsentState, onTelemetryConsentState),
      typedOn(
        MainToRenderer.TelemetryConsentSettings,
        onTelemetryConsentSettings,
      ),
      typedOn(MainToRenderer.OpenHaptic, onOpenHaptic),
    );

    return () => {
      cleanups.forEach(off => off());
    };
  }, []);
};

export default useMessageListener;
