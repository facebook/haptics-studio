/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import faker from 'faker';
import _ from 'lodash';
import path from 'path';
import fs from 'fs';
import {BrowserWindow} from 'electron';
import {promisify} from 'util';
import {HapticData} from '../../src/hapticsSdk';

import {generateMockContent, generateRandomClip} from '../mocks/project';
import mockedSettings from '../mocks/settings';

import * as HapticsSdk from '../../src/hapticsSdk';
import Constants from '../../src/common/constants';
import {IPCMessage} from '../../src/listeners';
import Project, {ClipMarker, ProjectContent} from '../../src/common/project';
import {ipcRenderer, dialog} from '../mocks/electron';
import WSServer from '../../src/wsServer';
import * as ProjectActions from '../../src/actions/project';
import MainApplication from '../../src/application';
import Configs from '../../src/common/configs';
import mockedDatamodel from '../mocks/datamodel';
// @oss-disable
import * as AnalysisActions from '../../src/actions/analysis';
import listeners, {
  AudioAnalysisMessage,
  AudioAnalysisUpdateMessage,
  HapticUpdateMessage,
  StereoSplitMessage,
} from '../../src/listeners/clips';
import * as utils from '../../src/common/utils';

describe('clips listeners', () => {
  const projectMock = generateMockContent();

  let response: IPCMessage;

  beforeAll(() => {
    // setup listeners
    listeners();
  });

  beforeEach(() => {
    jest
      .spyOn(MainApplication.instance, 'reloadMenuItems')
      .mockImplementation();
    jest.spyOn(WSServer.instance, 'sendClipUpdate').mockReturnValue();
    jest
      .spyOn(AnalysisActions, 'analyzeFiles')
      .mockReturnValue(Promise.resolve());
    jest
      .spyOn(AnalysisActions, 'updateAnalysis')
      .mockReturnValue(Promise.resolve());
    jest.spyOn(Configs.instance, 'setCurrentProject').mockReturnValue();
    jest
      .spyOn(MainApplication.instance, 'getMainWindow')
      .mockReturnValue({} as unknown as BrowserWindow);
    jest
      .spyOn(MainApplication.instance, 'reloadMenuItems')
      .mockImplementation();
    jest.spyOn(WSServer.instance, 'sendCurrentProject').mockReturnValue();
    Project.instance.loadContent(_.cloneDeep(projectMock.defautProjectContent));
  });

  describe('set current clip', () => {
    const testAction = 'set_current_clip';
    beforeEach(async () => {
      jest.spyOn(Project.instance, 'loadCurrentAudio').mockReturnValue();
      response = await ipcRenderer.invoke(testAction, {
        clipId: projectMock.clipId,
      });
    });

    it('should return ok message', () => {
      expect(response.status).toBe('ok');
    });

    it('should update the lastOpenedHapticId', () => {
      expect(Project.instance.getState().clipId).toBe(projectMock.clipId);
      expect(Project.instance.getState().sessionId).toBe(projectMock.sessionId);
    });
  });

  describe('delete clips', () => {
    const testAction = 'delete_clips';
    beforeEach(async () => {
      response = await ipcRenderer.invoke(testAction, {
        clipIds: [projectMock.clipId],
      });
    });

    it('should return ok message', () => {
      expect(response.status).toBe('ok');
    });

    it('should delete the clip', () => {
      expect(Project.instance.getClips()).toEqual([]);
    });
  });

  describe('relocate asset', () => {
    const testAction = 'relocate_asset';
    beforeEach(async () => {
      jest
        .spyOn(dialog, 'showOpenDialogSync')
        .mockReturnValue(['/path/to/audio_file.wav']);
      response = await ipcRenderer.invoke(testAction, {
        clipId: projectMock.clipId,
      });
    });

    it('should return ok message', () => {
      expect(response.status).toBe('ok');
    });

    it('should update the clip', () => {
      const foundClip = Project.instance.getClipById(projectMock.clipId);
      expect(foundClip?.audioAsset?.path).toEqual('/path/to/audio_file.wav');
    });
  });

  describe('add_audio_to_clip', () => {
    const testAction = 'add_audio_to_clip';
    const mockWaveform = {
      envelope: [
        {time: 0, amplitude: 0},
        {time: 0.42, amplitude: 1},
      ],
    };
    beforeEach(async () => {
      jest.spyOn(HapticsSdk, 'getWaveform').mockReturnValue(mockWaveform);
      jest
        .spyOn(dialog, 'showOpenDialogSync')
        .mockReturnValue(['/path/to/audio_file.wav']);
      response = await ipcRenderer.invoke(testAction, {
        clipId: projectMock.clipId,
      });
    });

    it('should return ok message', () => {
      expect(response.status).toBe('ok');
      expect(response.payload?.waveform).toBe(mockWaveform);
    });

    it('should update the audio resource', () => {
      const foundClip = Project.instance.getClipById(projectMock.clipId);
      expect(foundClip?.audioAsset?.path).toEqual('/path/to/audio_file.wav');
    });

    it('should update the waveform', () => {
      const foundClip = Project.instance.getClipById(projectMock.clipId);
      expect(foundClip?.waveform).toEqual(mockWaveform);
    });
  });

  describe('update clip name', () => {
    const testAction = 'update_clip_name';
    beforeEach(async () => {
      Project.instance.loadContent(projectMock.defautProjectContent);
      jest.spyOn(Configs.instance, 'getCurrentProject').mockReturnValue({
        name: projectMock.name,
        dirty: false,
        tmpProjectFile: '/tmp/file',
      });
      jest.spyOn(Configs.instance, 'setCurrentProject').mockImplementation();
      jest.spyOn(WSServer.instance, 'sendCurrentProject').mockImplementation();
      response = await ipcRenderer.invoke(testAction, {
        clipId: projectMock.clipId,
        name: 'new name',
      });
    });

    it('should update the name parameter', () => {
      const foundClip = Project.instance.getClipById(projectMock.clipId);
      expect(foundClip?.name).toEqual('new name');
    });

    it('should update the current project', () => {
      expect(Configs.instance.setCurrentProject).toHaveBeenCalledWith({
        name: projectMock.name,
        dirty: true,
        tmpProjectFile: '/tmp/file',
      });
    });

    it('should reload menu items', () => {
      expect(MainApplication.instance.reloadMenuItems).toHaveBeenCalledTimes(1);
    });

    it('should trigger sendCurrentProject', () => {
      expect(WSServer.instance.sendCurrentProject).toHaveBeenCalledTimes(1);
    });
  });

  describe('update tutorial notes', () => {
    const testAction = 'update_notes';
    const notes = 'my notes';
    beforeEach(async () => {
      jest.spyOn(Configs.instance, 'setCurrentProject').mockReturnValue();
      response = await ipcRenderer.invoke(testAction, {
        clipId: projectMock.clipId,
        notes,
      });
    });

    it('should return ok message', () => {
      expect(response.status).toBe('ok');
    });

    it('should update the tutorial notes of a clip', () => {
      const foundClip = Project.instance.getClipById(projectMock.clipId);
      expect(foundClip?.notes).toEqual(notes);
    });
  });

  describe('update markers', () => {
    const testAction = 'update_markers';
    const markers: ClipMarker[] = [
      {
        id: faker.datatype.uuid(),
        name: faker.random.word(),
        time: faker.datatype.number(),
        isEditing: faker.datatype.boolean(),
        isVisible: faker.datatype.boolean(),
      },
    ];
    beforeEach(async () => {
      jest.spyOn(Configs.instance, 'setCurrentProject').mockReturnValue();
      jest.spyOn(WSServer.instance, 'sendClipUpdate').mockReturnValue();
      response = await ipcRenderer.invoke(testAction, {
        clipId: projectMock.clipId,
        markers,
      });
    });

    it('should return ok message', () => {
      expect(response.status).toBe('ok');
    });

    it('should update the clips markers', () => {
      const foundClip = Project.instance.getClipById(projectMock.clipId);
      expect(foundClip?.markers).toEqual(markers);
    });
  });

  describe('update clip trim parameter', () => {
    const testAction = 'update_trim';
    beforeEach(async () => {
      Project.instance.loadContent(projectMock.defautProjectContent);
      jest.spyOn(Configs.instance, 'getCurrentProject').mockReturnValue({
        name: projectMock.name,
        dirty: false,
        tmpProjectFile: '/tmp/file',
      });
      jest.spyOn(Configs.instance, 'setCurrentProject').mockImplementation();
      jest.spyOn(WSServer.instance, 'sendCurrentProject').mockImplementation();
      response = await ipcRenderer.invoke(testAction, {
        clipId: projectMock.clipId,
        trim: 0.75,
      });
    });

    it('should update the trimAt parameter', () => {
      const foundClip = Project.instance.getClipById(projectMock.clipId);
      expect(foundClip?.trimAt).toEqual(0.75);
    });

    it('should update the current project', () => {
      expect(Configs.instance.setCurrentProject).toHaveBeenCalledWith({
        name: projectMock.name,
        dirty: true,
        tmpProjectFile: '/tmp/file',
      });
    });
  });

  describe('duplicate clips', () => {
    const testAction = 'duplicate_clips';
    const newClipId = faker.datatype.uuid();
    const clipName = faker.commerce.product();

    beforeEach(async () => {
      jest.spyOn(Configs.instance, 'getCurrentProject').mockReturnValue({
        name: projectMock.name,
        dirty: false,
        tmpProjectFile: '/tmp/file',
      });
      jest.spyOn(WSServer.instance, 'sendCurrentProject').mockReturnValue();
      jest.spyOn(ProjectActions, 'loadProject').mockImplementation();
      response = await ipcRenderer.invoke(testAction, {
        clips: [
          {
            originalClipId: projectMock.clipId,
            clipId: newClipId,
            name: clipName,
          },
        ],
      });
    });

    it('should return ok message', () => {
      expect(response.status).toBe('ok');
    });

    it('should duplicate the clip clip', () => {
      const existingClip = Project.instance.getClipById(projectMock.clipId);
      const duplicatedClip = Project.instance.getClipById(newClipId);
      expect(existingClip).not.toEqual(undefined);
      expect(duplicatedClip).not.toEqual(undefined);
    });

    it('should reload menu items', () => {
      expect(MainApplication.instance.reloadMenuItems).toHaveBeenCalledTimes(1);
    });

    it('should send current project to the HMD', () => {
      expect(WSServer.instance.sendCurrentProject).toHaveBeenCalledTimes(1);
    });
  });

  describe('export clips', () => {
    const testAction = 'export_clips';
    const exportPath = path.join(projectMock.tmpPath, 'my_export_path');

    beforeEach(() => {
      jest.spyOn(Configs.instance, 'getCurrentProject').mockReturnValue({
        name: projectMock.name,
        dirty: false,
        tmpProjectFile: '/tmp/file',
      });
      jest.spyOn(dialog, 'showOpenDialogSync').mockReturnValue([exportPath]);
      // @oss-disable
      fs.mkdirSync(exportPath, {recursive: true});
    });

    describe('with .haptic format', () => {
      beforeEach(async () => {
        response = await ipcRenderer.invoke(testAction, {
          clips: [Project.instance.getClips()[0].clipId],
          formats: ['haptic'],
          packageProject: false,
          flatten: false,
        });
      });

      it('should return ok message', () => {
        expect(response.status).toBe('ok');
      });

      it('should save the last exported path', () => {
        expect(Configs.configs.lastExportedPath).toBe(exportPath);
      });

      // @oss-disable
      // @oss-disable
        // @oss-disable
          // @oss-disable
          // @oss-disable
        // @oss-disable
      // @oss-disable

      it('should save the exported clip', () => {
        const exists = fs.existsSync(
          path.join(
            exportPath,
            `${Project.instance.getClips()[0].name ?? ''}.haptic`,
          ),
        );
        expect(exists).toBeTruthy();
      });

      describe('with clips that have the same name', () => {
        beforeEach(async () => {
          const content: ProjectContent = {
            version: {major: 1, minor: 0, patch: 0},
            metadata: {name: projectMock.name},
            state: {
              sessionId: projectMock.sessionId,
              clipId: faker.datatype.uuid(),
            },
            clips: [
              generateRandomClip({name: 'clip'}),
              generateRandomClip({name: 'clip'}),
            ],
            groups: [],
          };
          Project.instance.loadContent(_.cloneDeep(content));

          jest.spyOn(Configs.instance, 'getCurrentProject').mockReturnValue({
            name: projectMock.name,
            dirty: false,
            tmpProjectFile: '/tmp/file',
          });
          jest
            .spyOn(dialog, 'showOpenDialogSync')
            .mockReturnValue([exportPath]);
          response = await ipcRenderer.invoke(testAction, {
            clips: [
              Project.instance.getClips()[0].clipId,
              Project.instance.getClips()[1].clipId,
            ],
            formats: ['haptic'],
            packageProject: false,
            flatten: false,
          });
        });

        it('should save the exported clip', () => {
          expect(
            fs.existsSync(path.join(exportPath, 'clip.haptic')),
          ).toBeTruthy();
          expect(
            fs.existsSync(path.join(exportPath, 'clip (1).haptic')),
          ).toBeTruthy();
        });
      });

      describe('with trim parameter', () => {
        beforeEach(async () => {
          const content: ProjectContent = {
            version: {major: 1, minor: 0, patch: 0},
            metadata: {name: projectMock.name},
            state: {
              sessionId: projectMock.sessionId,
              clipId: faker.datatype.uuid(),
            },
            clips: [
              {
                ...generateRandomClip({name: 'clip'}),
                trimAt: 0.75,
              },
            ],
            groups: [],
          };
          Project.instance.loadContent(_.cloneDeep(content));

          jest.spyOn(Configs.instance, 'getCurrentProject').mockReturnValue({
            name: projectMock.name,
            dirty: false,
            tmpProjectFile: '/tmp/file',
          });
          jest
            .spyOn(dialog, 'showOpenDialogSync')
            .mockReturnValue([exportPath]);
          response = await ipcRenderer.invoke(testAction, {
            clips: [Project.instance.getClips()[0].clipId],
            formats: ['haptic'],
            packageProject: false,
            flatten: false,
          });
        });

        it('should save the trimmed clip', () => {
          expect(
            fs.existsSync(path.join(exportPath, 'clip.haptic')),
          ).toBeTruthy();
          const json = fs.readFileSync(path.join(exportPath, 'clip.haptic'), {
            encoding: 'utf-8',
          });
          const data: HapticData = JSON.parse(json);
          const {amplitude} = data.signals.continuous.envelopes;
          expect(amplitude[amplitude.length - 1].time).toBeCloseTo(0.75);
        });
      });
    });

    describe('with .ahap format', () => {
      beforeEach(async () => {
        response = await ipcRenderer.invoke(testAction, {
          clips: [Project.instance.getClips()[0].clipId],
          formats: ['ahap'],
          packageProject: false,
          flatten: false,
        });
      });

      it('should save the exported clip', () => {
        const continuousExists = fs.existsSync(
          path.join(
            exportPath,
            `${Project.instance.getClips()[0].name ?? ''}.continuous.ahap`,
          ),
        );
        expect(continuousExists).toBeTruthy();
        const transientsExists = fs.existsSync(
          path.join(
            exportPath,
            `${Project.instance.getClips()[0].name ?? ''}.transients.ahap`,
          ),
        );
        expect(transientsExists).toBeTruthy();
      });

      // @oss-disable
      // @oss-disable
        // @oss-disable
          // @oss-disable
          // @oss-disable
        // @oss-disable
      // @oss-disable
    });

    describe('with .wav format', () => {
      beforeEach(async () => {
        jest
          .spyOn(HapticsSdk, 'executeRenderer')
          .mockReturnValue(new Uint8Array());
        response = await ipcRenderer.invoke(testAction, {
          clips: [Project.instance.getClips()[0].clipId],
          formats: ['wav'],
          packageProject: false,
          flatten: false,
        });
      });

      it('should save the exported clip', () => {
        const continuousExists = fs.existsSync(
          path.join(
            exportPath,
            `${Project.instance.getClips()[0].name ?? ''}${Constants.EXPORT.SUFFIX}.wav`,
          ),
        );
        expect(continuousExists).toBeTruthy();
      });

      // @oss-disable
      // @oss-disable
        // @oss-disable
          // @oss-disable
          // @oss-disable
        // @oss-disable
      // @oss-disable
    });
  });

  describe('import haptics', () => {
    const testAction = 'import_haptics';
    const hapticsPath = path.join(projectMock.tmpPath, 'haptics');
    const anotherHapticsPath = path.join(hapticsPath, 'another');
    const hapticFilePath = path.join(hapticsPath, 'haptic1.haptic');
    const haptic2FilePath = path.join(anotherHapticsPath, 'haptic2.haptic');
    const files = [
      {
        clipId: faker.datatype.uuid(),
        path: hapticFilePath,
      },
      {
        clipId: faker.datatype.uuid(),
        path: haptic2FilePath,
      },
    ];

    describe('with all valid haptics', () => {
      beforeEach(async () => {
        fs.mkdirSync(hapticsPath, {recursive: true});
        fs.mkdirSync(anotherHapticsPath, {recursive: true});
        fs.writeFileSync(hapticFilePath, JSON.stringify(mockedDatamodel));
        fs.writeFileSync(haptic2FilePath, JSON.stringify(mockedDatamodel));
        Project.instance.loadContent(undefined);
        ipcRenderer.send(testAction, {files});
        // Wait for async message execution
        await promisify(setTimeout)(500);
      });

      it('should add clips to the project', () => {
        const clips = Project.instance.getClips();

        expect(clips.length).toBe(2);
        // Haptic 1
        expect(clips[0].clipId).toBe(files[0].clipId);
        expect(clips[0].name).toBe('haptic1');
        expect(clips[0].audioAsset?.hapticPath).toBe(hapticFilePath);
        expect(clips[0].audioAsset?.path).toBeUndefined();
        expect(clips[0].haptic as any).toEqual(
          expect.objectContaining({signals: mockedDatamodel.signals}),
        );
        // Haptic 2
        expect(clips[1].clipId).toBe(files[1].clipId);
        expect(clips[1].name).toBe('haptic2');
        expect(clips[1].audioAsset?.hapticPath).toBe(haptic2FilePath);
        expect(clips[1].audioAsset?.path).toBeUndefined();
        expect(clips[1].haptic as any).toEqual(
          expect.objectContaining({
            signals: mockedDatamodel.signals,
          }),
        );
      });

      it('should reload menu items', () => {
        expect(MainApplication.instance.reloadMenuItems).toHaveBeenCalledTimes(
          1,
        );
      });

      it('should trigger sendCurrentProject', () => {
        expect(WSServer.instance.sendCurrentProject).toHaveBeenCalledTimes(1);
      });
    });

    describe('with all invalid haptics', () => {
      beforeEach(async () => {
        fs.mkdirSync(hapticsPath, {recursive: true});
        fs.mkdirSync(anotherHapticsPath, {recursive: true});
        fs.writeFileSync(hapticFilePath, '{}');
        fs.writeFileSync(haptic2FilePath, '{}');
        Project.instance.loadContent(projectMock.defautProjectContent);
        ipcRenderer.send(testAction, {files});
        // Wait for async message execution
        await promisify(setTimeout)(500);
      });

      it('should not add clips to the project', () => {
        const clips = Project.instance.getClips();
        expect(clips.length).toBe(1);
      });

      it('should not reload menu items', () => {
        expect(MainApplication.instance.reloadMenuItems).toHaveBeenCalledTimes(
          0,
        );
      });

      it('should not trigger sendCurrentProject', () => {
        expect(WSServer.instance.sendCurrentProject).toHaveBeenCalledTimes(0);
      });
    });

    describe('with some valid haptics and some others not', () => {
      beforeEach(async () => {
        fs.mkdirSync(hapticsPath, {recursive: true});
        fs.mkdirSync(anotherHapticsPath, {recursive: true});
        fs.writeFileSync(hapticFilePath, JSON.stringify(mockedDatamodel));
        fs.writeFileSync(haptic2FilePath, '{}');
        Project.instance.loadContent(projectMock.defautProjectContent);
        ipcRenderer.send(testAction, {files});
        // Wait for async message execution
        await promisify(setTimeout)(500);
      });

      it('should add a single clip to the project', () => {
        const clips = Project.instance.getClips();
        expect(clips.length).toBe(2);
      });

      it('should reload menu items', () => {
        expect(MainApplication.instance.reloadMenuItems).toHaveBeenCalledTimes(
          1,
        );
      });

      it('should trigger sendCurrentProject', () => {
        expect(WSServer.instance.sendCurrentProject).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('audioAnalysis', () => {
    const testAction = 'audio_analysis';
    const silent = true;
    const files = _.times(2, n => {
      return {
        clipId: projectMock.clipId,
        path: path.join(projectMock.mocksPath, `audio_${n + 1}.wav`),
        settings: mockedSettings,
      };
    });
    const message: AudioAnalysisMessage = {silent, files};
    let response: any;

    beforeEach(async () => {
      Project.instance.loadContent(undefined);
      ipcRenderer.send(testAction, message);
      ipcRenderer.on('project_info', (event, data) => {
        response = data;
      });
      // Wait the event callback
      await promisify(setTimeout)(0);
    });

    it('should create a new project', () => {
      expect(Project.instance.hasContent()).toBeTruthy();
      expect(Project.instance.getName()).toEqual(
        Constants.DEFAULT_PROJECT_NAME,
      );
    });

    it('should call analyze files once', done => {
      expect(AnalysisActions.analyzeFiles).toHaveBeenCalledTimes(1);
      expect(AnalysisActions.analyzeFiles).toHaveBeenCalledWith(
        expect.anything(),
        testAction,
        files,
        silent,
      );
      done();
    });

    it('should set the current project', () => {
      expect(Configs.instance.setCurrentProject).toHaveBeenCalledTimes(1);
      Project.instance.create(Constants.DEFAULT_PROJECT_NAME);
      jest.spyOn(Configs.instance, 'getCurrentProject').mockReturnValue({
        tmpProjectFile: Project.instance.getProjectFile(),
        name: Project.instance.getName(),
        dirty: true,
      });
    });

    it('should update the WSSocket with the new project', () => {
      expect(WSServer.instance.sendCurrentProject).toHaveBeenCalledTimes(1);
    });

    it('should send a project_info message', () => {
      expect(response).toEqual({
        action: 'audio_analysis',
        status: 'ok',
        payload: {
          name: Constants.DEFAULT_PROJECT_NAME,
          isAuthoringTutorial: false,
          isSampleProject: false,
          isTutorial: false,
        },
      });
    });
  });

  describe('updateAudioAnalysis', () => {
    const testAction = 'update_audio_analysis';
    const message: AudioAnalysisUpdateMessage = {
      clipId: projectMock.clipId,
      settings: mockedSettings,
      group: 'amplitude',
    };

    beforeEach(async () => {
      Project.instance.loadContent(undefined);
      ipcRenderer.send(testAction, message);
      // Wait the event callback
      await promisify(setTimeout)(0);
    });

    it('should call the updateAnalysis method', done => {
      expect(AnalysisActions.updateAnalysis).toHaveBeenCalledWith(
        expect.anything(),
        'update_audio_analysis',
        projectMock.clipId,
        mockedSettings,
        'amplitude',
      );
      done();
    });
  });

  describe('splitAndAnalyseClip', () => {
    const testAction = 'split_stereo_clip';
    let message: StereoSplitMessage = {
      clipId: projectMock.clipId,
      channels: [
        {
          clipId: faker.datatype.uuid(),
          name: 'left',
        },
        {
          clipId: faker.datatype.uuid(),
          name: 'right',
        },
      ],
      settings: mockedSettings,
    };

    beforeEach(async () => {
      message = {
        ...message,
        clipId: projectMock.clipId,
      };
      Project.instance.create(Constants.DEFAULT_PROJECT_NAME);
      jest.spyOn(Configs.instance, 'getCurrentProject').mockReturnValue({
        tmpProjectFile: Project.instance.getProjectFile(),
        name: Project.instance.getName(),
        dirty: true,
      });
      jest.spyOn(Project.instance, 'addOrUpdateClip').mockReturnValue();
      jest
        .spyOn(Project.instance, 'getClipById')
        .mockReturnValue(projectMock.clip);
      jest.spyOn(Project.instance, 'getState').mockReturnValue({
        sessionId: projectMock.sessionId,
        clipId: projectMock.clipId,
      });
      jest.spyOn(HapticsSdk, 'validateJsonString').mockReturnValue(true);

      jest
        .spyOn(utils, 'getSplitChannels')
        .mockImplementation((path?: string) => {
          return Promise.resolve({
            left: `${path ?? ''}-left.wav`,
            right: `${path ?? ''}-right.wav`,
          });
        });

      ipcRenderer.send(testAction, message);
      await promisify(setTimeout)(0);
    });

    it('should analyze the files and update the project', done => {
      expect(AnalysisActions.analyzeFiles).toHaveBeenCalledTimes(1);
      expect(AnalysisActions.analyzeFiles).toHaveBeenCalledWith(
        expect.anything(),
        'audio_analysis',
        expect.anything(),
        true,
      );
      expect(Configs.instance.setCurrentProject).toHaveBeenCalledTimes(1);
      done();
    });
  });

  describe('hapticUpdate', () => {
    const testAction = 'haptic_update';
    const message: HapticUpdateMessage = {
      clipId: projectMock.clipId,
      haptic: mockedDatamodel,
    };

    beforeEach(() => {
      jest.spyOn(Configs.instance, 'getCurrentProject').mockReturnValue({
        tmpProjectFile: projectMock.tmpProjectFile,
        name: projectMock.name,
        dirty: true,
      });
      jest.spyOn(Project.instance, 'addOrUpdateClip').mockReturnValue();
      jest
        .spyOn(Project.instance, 'getClipById')
        .mockReturnValue(projectMock.clip);
      jest.spyOn(Project.instance, 'getState').mockReturnValue({
        sessionId: projectMock.sessionId,
        clipId: projectMock.clipId,
      });
      jest.spyOn(HapticsSdk, 'validateJsonString').mockReturnValue(true);
    });

    describe('when the haptic content is not valid', () => {
      beforeEach(async () => {
        jest.spyOn(HapticsSdk, 'validateJsonString').mockReturnValue(false);
        response = await ipcRenderer.invoke(testAction, message);
      });
      it('should return a message with invalid status', () => {
        const {status} = response;
        expect(status).toEqual('invalid');
      });
    });

    describe('when the project info are correct', () => {
      beforeEach(async () => {
        jest.spyOn(Configs.instance, 'addRecentProject').mockReturnValue();
        jest.spyOn(Configs.instance, 'setCurrentProject').mockReturnValue();
        jest.spyOn(Project.instance, 'updateState').mockReturnValue();
        response = await ipcRenderer.invoke(testAction, message);
      });

      it('should return an ok message', () => {
        const {status, action, payload} = response;
        expect(status).toEqual('ok');
        expect(action).toEqual(testAction);
        expect(payload).toEqual({});
      });

      it('should call addOrUpdateClip once', () => {
        expect(Project.instance.addOrUpdateClip).toHaveBeenCalledTimes(1);
        expect(Project.instance.addOrUpdateClip).toHaveBeenCalledWith({
          sessionId: projectMock.sessionId,
          clipId: projectMock.clipId,
          name: projectMock.clip.name,
          audio: projectMock.clip.audioAsset,
          haptic: message.haptic,
        });
      });

      it('should call setCurrentProject once', () => {
        expect(Configs.instance.setCurrentProject).toHaveBeenCalledTimes(1);
        expect(Configs.instance.setCurrentProject).toHaveBeenCalledWith({
          tmpProjectFile: projectMock.tmpProjectFile,
          dirty: true,
          name: projectMock.name,
        });
      });

      it('should call sendClipUpdate WS once', () => {
        expect(WSServer.instance.sendClipUpdate).toHaveBeenCalledTimes(1);
      });
    });
  });
});
