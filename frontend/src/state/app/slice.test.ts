/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {v4 as uuidv4} from 'uuid';
import {defaultDspSettings, packDspSettings} from '../dsp';
import {RootState, createStore, initialValues} from '../store';
import appSlice from './slice';
import editorDataMock from '../../__mocks__/editorDataMock';
import {
  DeviceConnectionStatus,
  EnvelopeType,
  FocusArea,
  LandingPageSection,
  RightPanelSection,
  SnackbarType,
} from '../types';
import Constants, {TermsAcceptedKey} from '../../../src/globals/constants';
import projectSlice from '../project/slice';
import editingToolsSlice from '../editingTools/slice';

describe('project slice', () => {
  const clipId = uuidv4();
  const mock = editorDataMock;
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore({
      ...initialValues,
      project: {
        ...initialValues.project,
        groups: [
          {id: 'group1', name: 'clip1', isFolder: false, clips: [clipId]},
        ],
        clips: {
          [clipId]: {
            name: 'Clip',
            loading: false,
            failed: false,
            error: undefined,
            audio: {path: '/path/clip.wav'},
            svg: mock.svg,
            hasChanges: {
              amplitude: false,
              frequency: false,
            },
            timeline: {duration: 1, samples: 10, startTime: 0, endTime: 0.5},
            playhead: 0,
            markers: [],
            trimAt: undefined,
            state: {
              past: [
                {
                  revision: 1,
                  dsp: defaultDspSettings(),
                  haptic: mock.haptic,
                  selectedPoints: [],
                  selectedEmphasis: undefined,
                },
              ],
              future: [
                {
                  revision: 3,
                  dsp: defaultDspSettings(),
                  haptic: mock.haptic,
                  selectedPoints: [],
                  selectedEmphasis: undefined,
                },
              ],
              present: {
                revision: 2,
                dsp: defaultDspSettings(),
                haptic: mock.haptic,
                selectedPoints: [],
                selectedEmphasis: undefined,
              },
            },
          },
        },
      },
    });
  });

  describe('showSnackbar', () => {
    it('should set the snackbar properties', () => {
      store.dispatch(
        appSlice.actions.showSnackbar({
          text: 'test',
          snackbarType: SnackbarType.Success,
          autoDismiss: true,
          action: 'upgrade',
        }),
      );
      expect((store.getState() as RootState).app.snackbar?.text).toEqual(
        'test',
      );
      expect((store.getState() as RootState).app.snackbar?.type).toEqual(
        SnackbarType.Success,
      );
      expect((store.getState() as RootState).app.snackbar?.autoDismiss).toEqual(
        true,
      );
      expect((store.getState() as RootState).app.snackbar?.action).toEqual(
        'upgrade',
      );
    });
  });

  describe('dismissSnackbar', () => {
    it('should reset the snackbar property', () => {
      store.dispatch(appSlice.actions.dismissSnackbar());
      expect((store.getState() as RootState).app.snackbar).toEqual(undefined);
    });
  });

  describe('setLandingPageSection', () => {
    it('should set the landing page section', () => {
      expect((store.getState() as RootState).app.landingPageSection).toEqual(
        LandingPageSection.Projects,
      );
      store.dispatch(
        appSlice.actions.setLandingPageSection({
          section: LandingPageSection.Learning,
        }),
      );
      expect((store.getState() as RootState).app.landingPageSection).toEqual(
        LandingPageSection.Learning,
      );
    });
  });

  describe('setFocusArea', () => {
    it('should set the focus area property', () => {
      store.dispatch(
        appSlice.actions.setFocusArea({focus: FocusArea.Navigator}),
      );
      expect((store.getState() as RootState).app.focus).toEqual(
        FocusArea.Navigator,
      );
    });
  });

  describe('toggleDefaultControls', () => {
    it('should toggle the app default controls', () => {
      store.dispatch(appSlice.actions.toggleDefaultControls({enabled: true}));
      expect((store.getState() as RootState).app.defaultControlEnabled).toEqual(
        true,
      );
      store.dispatch(appSlice.actions.toggleDefaultControls({enabled: false}));
      expect((store.getState() as RootState).app.defaultControlEnabled).toEqual(
        false,
      );
    });
  });

  describe('setSidePanelWidth', () => {
    it('should panel width to the correct side', () => {
      store.dispatch(
        appSlice.actions.setSidePanelWidth({
          width: Constants.panels.sidePanelMaxWidth,
          side: 'left',
        }),
      );
      store.dispatch(
        appSlice.actions.setSidePanelWidth({
          width: Constants.panels.sidePanelMinWidth,
          side: 'right',
        }),
      );
      expect((store.getState() as RootState).app.leftPanel.width).toEqual(
        Constants.panels.sidePanelMaxWidth,
      );
      expect((store.getState() as RootState).app.rightPanel.width).toEqual(
        Constants.panels.sidePanelMinWidth,
      );
    });

    it('should not set the size above or below the limits', () => {
      store.dispatch(
        appSlice.actions.setSidePanelWidth({
          width: Constants.panels.sidePanelMaxWidth + 1,
          side: 'left',
        }),
      );
      store.dispatch(
        appSlice.actions.setSidePanelWidth({
          width: Constants.panels.sidePanelMinWidth - 1,
          side: 'right',
        }),
      );
      expect((store.getState() as RootState).app.leftPanel.width).toEqual(
        Constants.panels.sidePanelMaxWidth,
      );
      expect((store.getState() as RootState).app.rightPanel.width).toEqual(
        Constants.panels.sidePanelMinWidth,
      );
    });
  });

  describe('toggleAudioVisibility', () => {
    it('should toggle the visibility flag', () => {
      const status = (store.getState() as RootState).app.visibility.audio;
      store.dispatch(appSlice.actions.toggleAudioVisibility());
      expect((store.getState() as RootState).app.visibility.audio).toEqual(
        !status,
      );
    });
  });

  describe('setSelectedEnvelope', () => {
    it('should set the envelope in the visibility property', () => {
      store.dispatch(
        appSlice.actions.setSelectedEnvelope({
          clipId,
          envelope: EnvelopeType.Frequency,
        }),
      );
      expect((store.getState() as RootState).app.visibility.envelope).toEqual(
        EnvelopeType.Frequency,
      );
    });
  });

  describe('fetchRecentsSuccess', () => {
    it('should populate the recent array', () => {
      store.dispatch(
        appSlice.actions.fetchRecentsSuccess({
          recentProjects: [
            {projectFile: '/path/to/file', name: 'Recent', updatedAt: 0},
          ],
        }),
      );
      expect((store.getState() as RootState).app.recentProjects.length).toEqual(
        1,
      );
      expect(
        (store.getState() as RootState).app.recentProjects[0].name,
      ).toEqual('Recent');
    });
  });

  describe('fetchRecentsFailure', () => {
    it('should trigger the snackbar', () => {
      store.dispatch(
        appSlice.actions.fetchRecentsFailure({error: 'failed to fetch'}),
      );
      expect((store.getState() as RootState).app.snackbar).not.toEqual(
        undefined,
      );
      expect((store.getState() as RootState).app.snackbar?.text).toEqual(
        'failed to fetch',
      );
      expect((store.getState() as RootState).app.snackbar?.type).toEqual(
        SnackbarType.Error,
      );
      expect((store.getState() as RootState).app.snackbar?.autoDismiss).toEqual(
        true,
      );
    });
  });

  describe('loadSamplesSuccess', () => {
    it('should populate the sample array', () => {
      store.dispatch(
        appSlice.actions.loadSamplesSuccess({
          sampleProjects: [
            {
              projectFile: '/path/to/file',
              name: 'Sample',
              icon: '/path/to/icon',
              clipsCount: 2,
            },
          ],
        }),
      );
      expect((store.getState() as RootState).app.sampleProjects.length).toEqual(
        1,
      );
      expect(
        (store.getState() as RootState).app.sampleProjects[0].name,
      ).toEqual('Sample');
    });
  });

  describe('loadSamplesFailure', () => {
    it('should trigger the snackbar', () => {
      store.dispatch(
        appSlice.actions.loadSamplesFailure({error: 'failed to fetch'}),
      );
      expect((store.getState() as RootState).app.snackbar).not.toEqual(
        undefined,
      );
      expect((store.getState() as RootState).app.snackbar?.text).toEqual(
        'failed to fetch',
      );
      expect((store.getState() as RootState).app.snackbar?.type).toEqual(
        SnackbarType.Error,
      );
      expect((store.getState() as RootState).app.snackbar?.autoDismiss).toEqual(
        true,
      );
    });
  });

  describe('showDialog', () => {
    it('should set the dialog properties', () => {
      store.dispatch(
        appSlice.actions.showDialog({
          title: 'title',
          text: 'test',
          confirmButton: 'confirm',
          action: projectSlice.actions.deleteClips({clipIds: [clipId]}),
        }),
      );
      expect((store.getState() as RootState).app.dialog.visible).toEqual(true);
      expect((store.getState() as RootState).app.dialog.title).toEqual('title');
      expect((store.getState() as RootState).app.dialog.text).toEqual('test');
      expect((store.getState() as RootState).app.dialog.confirmButton).toEqual(
        'confirm',
      );
      expect((store.getState() as RootState).app.dialog.action).toEqual(
        projectSlice.actions.deleteClips({clipIds: [clipId]}),
      );
    });
  });

  describe('dismissDialog', () => {
    it('should hide the dialog', () => {
      store.dispatch(appSlice.actions.dismissDialog());
      expect((store.getState() as RootState).app.dialog.visible).toEqual(false);
    });
  });

  describe('showContextMenu', () => {
    it('should set the context menu position', () => {
      store.dispatch(
        appSlice.actions.showContextMenu({position: {x: 10, y: 20}}),
      );
      expect((store.getState() as RootState).app.contextMenu?.x).toEqual(10);
      expect((store.getState() as RootState).app.contextMenu?.y).toEqual(20);
    });
  });

  describe('dismissContextMenu', () => {
    it('should reset the context menu as undefined', () => {
      store.dispatch(appSlice.actions.dismissContextMenu());
      expect((store.getState() as RootState).app.contextMenu).toBeUndefined();
    });
  });

  describe('showExportDialog', () => {
    it('should set the export dialog open state', () => {
      store.dispatch(appSlice.actions.showExportDialog({clips: [clipId]}));
      expect(
        (store.getState() as RootState).app.exportDialog.open,
      ).toBeTruthy();
      expect((store.getState() as RootState).app.exportDialog.status).toEqual(
        'none',
      );
    });
  });

  describe('dismissExportDialog', () => {
    it('should reset the export dialog as undefined', () => {
      store.dispatch(appSlice.actions.dismissExportDialog());
      expect((store.getState() as RootState).app.exportDialog.open).toBeFalsy();
    });
  });

  describe('showBugReportDialog', () => {
    it('should set the bug report dialog as visible', () => {
      store.dispatch(appSlice.actions.showBugReportDialog());
      expect((store.getState() as RootState).app.showBugReportDialog).toEqual(
        true,
      );
    });
  });

  describe('dismissBugReportDialog', () => {
    it('should set the bug report dialog as not visible', () => {
      store.dispatch(appSlice.actions.dismissBugReportDialog());
      expect((store.getState() as RootState).app.showBugReportDialog).toEqual(
        false,
      );
    });
  });

  describe('setRightPanelItem', () => {
    it('should set the item key for the right panel', () => {
      store.dispatch(
        appSlice.actions.setRightPanelItem({item: RightPanelSection.Markers}),
      );
      expect((store.getState() as RootState).app.rightPanel.item).toEqual(
        RightPanelSection.Markers,
      );
    });
  });

  describe('setWSAuthCode', () => {
    it('should set the authentication code for the websocket', () => {
      store.dispatch(appSlice.actions.setWSAuthCode({wsAuthCode: '12345'}));
      expect((store.getState() as RootState).app.wsAuthCode).toEqual('12345');
    });
  });

  describe('setWSDeviceStatus', () => {
    it('should set the new status', () => {
      const deviceId = uuidv4();
      store.dispatch(
        appSlice.actions.setConnectedDevices({
          connectedDevices: {
            [deviceId]: {
              status: DeviceConnectionStatus.Active,
              deviceId,
              name: 'Quest 2',
              model: 'Quest 2',
              version: '1.0.0',
            },
          },
        }),
      );
      expect(
        Object.keys((store.getState() as RootState).app.connectedDevices)
          .length,
      ).toEqual(1);
      expect(
        (store.getState() as RootState).app.connectedDevices[deviceId],
      ).not.toBeUndefined();
      expect(
        (store.getState() as RootState).app.connectedDevices[deviceId].status,
      ).toEqual(DeviceConnectionStatus.Active);
    });
  });

  describe('toggleDevicePanelState', () => {
    it('should open the device panel', () => {
      store.dispatch(appSlice.actions.toggleDevicePanelState({open: true}));
      expect((store.getState() as RootState).app.showDevicePanel).toBeTruthy();
    });

    it('should close the device panel', () => {
      store.dispatch(appSlice.actions.toggleDevicePanelState({open: false}));
      expect((store.getState() as RootState).app.showDevicePanel).toBeFalsy();
    });
  });

  describe('updateWindowInformation', () => {
    it('should set the new window info', () => {
      store.dispatch(
        appSlice.actions.updateWindowInformation({
          windowInformation: {
            title: 'new-title',
            size: [1000, 800],
            projectName: 'project',
            isCurrentProjectDirty: true,
            fullScreen: false,
            isOnWindows: false,
            version: '1.0.0',
            flags: {externalAudio: true},
          },
        }),
      );
      expect(
        (store.getState() as RootState).app.windowInformation.title,
      ).toEqual('new-title');
      expect(
        (store.getState() as RootState).app.windowInformation.size,
      ).toEqual([1000, 800]);
      expect(
        (store.getState() as RootState).app.windowInformation.projectName,
      ).toEqual('project');
      expect(
        (store.getState() as RootState).app.windowInformation
          .isCurrentProjectDirty,
      ).toEqual(true);
      expect(
        (store.getState() as RootState).app.windowInformation.fullScreen,
      ).toEqual(false);
      expect(
        (store.getState() as RootState).app.windowInformation.isOnWindows,
      ).toEqual(false);
      expect(
        (store.getState() as RootState).app.windowInformation.version,
      ).toEqual('1.0.0');
      expect(
        (store.getState() as RootState).app.windowInformation.flags
          .externalAudio,
      ).toBeTruthy();
    });
  });

  describe('updateTermsAndConditionsApprove', () => {
    it('should set the terms as accepted', () => {
      store.dispatch(
        appSlice.actions.updateTermsAndConditionsApprove({termsAccepted: true}),
      );
      expect(window.localStorage.getItem(TermsAcceptedKey)).toEqual('true');
      expect((store.getState() as RootState).app.termsAccepted).toEqual(true);
    });
  });

  describe('updateAvailable', () => {
    it('should set the new status of the updater', () => {
      store.dispatch(
        appSlice.actions.updateAvailable({
          updateInfo: {
            releaseDate: 'today',
            releaseNotes: 'notes',
            version: '2.0.0',
          },
        }),
      );
      expect((store.getState() as RootState).app.updater?.releaseDate).toEqual(
        'today',
      );
      expect((store.getState() as RootState).app.updater?.releaseNotes).toEqual(
        'notes',
      );
      expect((store.getState() as RootState).app.updater?.version).toEqual(
        '2.0.0',
      );
    });
  });

  describe('updateDownloaded', () => {
    it('should set the new status of the updater', () => {
      store.dispatch(
        appSlice.actions.updateAvailable({
          updateInfo: {
            releaseDate: 'today',
            releaseNotes: 'notes',
            version: '2.0.0',
          },
        }),
      );
      store.dispatch(appSlice.actions.updateDownloaded());
      expect((store.getState() as RootState).app.updater?.downloaded).toEqual(
        true,
      );
      expect((store.getState() as RootState).app.updater?.progress).toEqual(
        100,
      );
    });
  });

  describe('updateDownloadProgress', () => {
    it('should set the new status of the updater', () => {
      store.dispatch(
        appSlice.actions.updateAvailable({
          updateInfo: {
            releaseDate: 'today',
            releaseNotes: 'notes',
            version: '2.0.0',
          },
        }),
      );
      store.dispatch(appSlice.actions.updateDownloadProgress({progress: 50}));
      expect((store.getState() as RootState).app.updater?.progress).toEqual(50);
    });
  });

  describe('updateError', () => {
    it('should set reset the download progress', () => {
      store.dispatch(
        appSlice.actions.updateAvailable({
          updateInfo: {
            releaseDate: 'today',
            releaseNotes: 'notes',
            version: '2.0.0',
          },
        }),
      );
      store.dispatch(appSlice.actions.updateError());
      expect((store.getState() as RootState).app.updater?.downloaded).toEqual(
        false,
      );
      expect((store.getState() as RootState).app.updater?.progress).toBeNull();
    });
  });

  describe('showUpdateReleaseNotes', () => {
    it('should set the dialog visibility', () => {
      store.dispatch(
        appSlice.actions.updateAvailable({
          updateInfo: {
            releaseDate: 'today',
            releaseNotes: 'notes',
            version: '2.0.0',
          },
        }),
      );
      store.dispatch(appSlice.actions.showUpdateReleaseNotes({visible: true}));
      expect((store.getState() as RootState).app.updater?.showDialog).toEqual(
        true,
      );
    });
  });

  describe('setPointDetail', () => {
    it('should store the point details', () => {
      store.dispatch(
        appSlice.actions.setPointDetail({time: 0.42, value: 1.23}),
      );
      expect((store.getState() as RootState).app.pointDetail.time).toEqual(
        0.42,
      );
      expect((store.getState() as RootState).app.pointDetail.value).toEqual(
        1.23,
      );
    });
  });

  describe('extraReducers', () => {
    describe('analysisSuccess', () => {
      it('should reset the right panel and the landing section', () => {
        store.dispatch(
          projectSlice.actions.analysisSuccess({
            name: 'audio',
            clipId,
            settings: packDspSettings(defaultDspSettings()),
            svg: mock.svg,
            haptic: mock.haptic,
            audio: {
              path: './audio.wav',
            },
          }),
        );
        expect((store.getState() as RootState).app.rightPanel.item).toEqual(
          RightPanelSection.Analysis,
        );
        expect((store.getState() as RootState).app.landingPageSection).toEqual(
          LandingPageSection.Projects,
        );
      });

      it('should set the right panel to the edit tab if the clip has no audio', () => {
        store.dispatch(
          projectSlice.actions.analysisSuccess({
            name: 'audio',
            clipId,
            settings: packDspSettings(defaultDspSettings()),
            svg: mock.svg,
            haptic: mock.haptic,
            audio: {
              hapticPath: './imported.haptic',
            },
          }),
        );
        expect((store.getState() as RootState).app.rightPanel.item).toEqual(
          RightPanelSection.Design,
        );
        expect((store.getState() as RootState).app.landingPageSection).toEqual(
          LandingPageSection.Projects,
        );
      });
    });

    describe('openProjectSuccess', () => {
      it('should reset the right panel and the landing section', () => {
        store.dispatch(
          appSlice.actions.setLandingPageSection({
            section: LandingPageSection.Learning,
          }),
        );
        store.dispatch(
          projectSlice.actions.openProjectSuccess({
            project: {
              projectExists: true,
              clips: [],
              groups: [],
              isSample: false,
              isTutorial: false,
              isAuthoringTutorial: false,
              name: 'project',
              lastOpenedClipId: clipId,
            },
          }),
        );
        expect((store.getState() as RootState).app.rightPanel.item).toEqual(
          RightPanelSection.Design,
        );
      });

      it('should keep the landing section if the project is a tutorial', () => {
        store.dispatch(
          appSlice.actions.setLandingPageSection({
            section: LandingPageSection.Learning,
          }),
        );
        store.dispatch(
          projectSlice.actions.openProjectSuccess({
            project: {
              projectExists: true,
              clips: [],
              groups: [],
              isSample: false,
              isTutorial: true,
              isAuthoringTutorial: false,
              name: 'project',
              lastOpenedClipId: clipId,
            },
          }),
        );
        expect((store.getState() as RootState).app.landingPageSection).toEqual(
          LandingPageSection.Learning,
        );
      });
    });

    describe('updateHapticFailure', () => {
      it('should notify the error in the snackbar', () => {
        store.dispatch(
          projectSlice.actions.updateHapticFailure({error: 'failed', clipId}),
        );
        expect(
          (store.getState() as RootState).app.snackbar,
        ).not.toBeUndefined();
        expect((store.getState() as RootState).app.snackbar?.textKey).toEqual(
          'error.dataValidationFailed',
        );
        expect(
          (store.getState() as RootState).app.snackbar?.text,
        ).toBeUndefined();
        expect((store.getState() as RootState).app.snackbar?.type).toEqual(
          SnackbarType.Error,
        );
        expect(
          (store.getState() as RootState).app.snackbar?.autoDismiss,
        ).toEqual(true);
      });
    });

    describe('pastePoints', () => {
      it('should set the clipboard property', () => {
        store.dispatch(
          projectSlice.actions.pastePoints({
            clipId,
            clipboard: {
              amplitude: [{time: 1, amplitude: 1}],
              frequency: [{time: 2, frequency: 2}],
            },
          }),
        );
        expect(
          (store.getState() as RootState).app.clipboard.amplitude[0].amplitude,
        ).toEqual(1);
        expect(
          (store.getState() as RootState).app.clipboard.frequency[0].frequency,
        ).toEqual(2);
      });
    });

    describe('addMarker', () => {
      it('should set the markers item as current in the right panel', () => {
        store.dispatch(
          projectSlice.actions.createMarker({clipId, time: 0, name: 'm1'}),
        );
        expect((store.getState() as RootState).app.rightPanel.item).toEqual(
          'markers',
        );
      });
    });

    describe('showTutorialPreview', () => {
      it('should set the tutorial preview visibility', () => {
        store.dispatch(appSlice.actions.showTutorialPreview({visible: true}));
        expect(
          (store.getState() as RootState).app.tutorialEditor.showPreview,
        ).toEqual(true);
      });

      it('should reset the tutorial preview visibility when a project is not a tutorial', () => {
        store.dispatch(appSlice.actions.showTutorialPreview({visible: true}));
        expect(
          (store.getState() as RootState).app.tutorialEditor.showPreview,
        ).toEqual(true);

        store.dispatch(
          projectSlice.actions.projectInfo({
            name: '',
            isAuthoringTutorial: false,
          }),
        );
        expect(
          (store.getState() as RootState).app.tutorialEditor.showPreview,
        ).toEqual(false);
      });
    });

    describe('showTutorialSettings', () => {
      it('should set the tutorial settings visibility', () => {
        store.dispatch(appSlice.actions.showTutorialSettings({visible: true}));
        expect(
          (store.getState() as RootState).app.tutorialEditor.showSettings,
        ).toEqual(true);
      });

      it('should reset the tutorial settings visibility when a project is not a tutorial', () => {
        store.dispatch(appSlice.actions.showTutorialSettings({visible: true}));
        expect(
          (store.getState() as RootState).app.tutorialEditor.showSettings,
        ).toEqual(true);

        store.dispatch(
          projectSlice.actions.projectInfo({
            name: '',
            isAuthoringTutorial: false,
          }),
        );
        expect(
          (store.getState() as RootState).app.tutorialEditor.showSettings,
        ).toEqual(false);
      });
    });

    describe('closeProject', () => {
      it('should reset the context menu', () => {
        store.dispatch(projectSlice.actions.closeProject());
        expect((store.getState() as RootState).app.contextMenu).toBeUndefined();
      });

      it('should reset the export dialog', () => {
        store.dispatch(projectSlice.actions.closeProject());
        expect(
          (store.getState() as RootState).app.exportDialog.open,
        ).toBeFalsy();
      });

      it('should reset the dialog', () => {
        store.dispatch(projectSlice.actions.closeProject());
        expect((store.getState() as RootState).app.dialog.visible).toBeFalsy();
      });

      it('should reset the clipboard', () => {
        store.dispatch(projectSlice.actions.closeProject());
        expect((store.getState() as RootState).app.clipboard.amplitude).toEqual(
          [],
        );
        expect((store.getState() as RootState).app.clipboard.frequency).toEqual(
          [],
        );
      });
    });

    describe('openProjectFailure', () => {
      it('should notify the error in the snackbar', () => {
        store.dispatch(
          projectSlice.actions.openProjectFailure({error: 'failure'}),
        );
        expect(
          (store.getState() as RootState).app.snackbar,
        ).not.toBeUndefined();
        expect((store.getState() as RootState).app.snackbar?.text).toEqual(
          'failure',
        );
        expect(
          (store.getState() as RootState).app.snackbar?.textKey,
        ).toBeUndefined();
        expect((store.getState() as RootState).app.snackbar?.type).toEqual(
          SnackbarType.Error,
        );
        expect(
          (store.getState() as RootState).app.snackbar?.autoDismiss,
        ).toEqual(true);
      });
    });

    describe('confirmPaste', () => {
      it('should empty the clipboard', () => {
        store.dispatch(
          projectSlice.actions.confirmPaste({
            clipId,
            clipboard: {amplitude: [], frequency: []},
            inPlace: false,
            offset: 0,
          }),
        );
        expect((store.getState() as RootState).app.clipboard.amplitude).toEqual(
          [],
        );
        expect((store.getState() as RootState).app.clipboard.frequency).toEqual(
          [],
        );
      });
    });

    describe('cancelPaste', () => {
      it('should empty the clipboard', () => {
        store.dispatch(projectSlice.actions.cancelPaste());
        expect((store.getState() as RootState).app.clipboard.amplitude).toEqual(
          [],
        );
        expect((store.getState() as RootState).app.clipboard.frequency).toEqual(
          [],
        );
      });
    });

    describe('setCurrentClip', () => {
      it('should clear the clipboard when switching clips', () => {
        store.dispatch(
          projectSlice.actions.pastePoints({
            clipId,
            clipboard: {
              amplitude: [{time: 1, amplitude: 1}],
              frequency: [{time: 2, frequency: 2}],
            },
          }),
        );
        expect(
          (store.getState() as RootState).app.clipboard.amplitude,
        ).toHaveLength(1);

        store.dispatch(projectSlice.actions.setCurrentClip({id: clipId}));
        expect((store.getState() as RootState).app.clipboard.amplitude).toEqual(
          [],
        );
        expect((store.getState() as RootState).app.clipboard.frequency).toEqual(
          [],
        );
      });
    });

    describe('editingTools.enableEmphasis', () => {
      it('should ensure that the amplitude envelope is selected', () => {
        store.dispatch(
          appSlice.actions.setSelectedEnvelope({
            envelope: EnvelopeType.Frequency,
          }),
        );
        expect((store.getState() as RootState).app.visibility.envelope).toEqual(
          EnvelopeType.Frequency,
        );
        store.dispatch(editingToolsSlice.actions.enableEmphasis());
        expect((store.getState() as RootState).app.visibility.envelope).toEqual(
          EnvelopeType.Amplitude,
        );
      });
    });
  });
});
