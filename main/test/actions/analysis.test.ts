/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import {promisify} from 'util';
import _ from 'lodash';

import * as Actions from '../../src/actions/analysis';
import Project, {ProjectContent} from '../../src/common/project';
import Configs from '../../src/common/configs';
import MainApplication from '../../src/application';
import * as HapticsSdk from '../../src/hapticsSdk';
import * as Utils from '../../src/common/utils';
import mockDataModel from '../mocks/datamodel';
import mockedSettings from '../mocks/settings';
import mockedSvg from '../mocks/svg';
import {generateMockContent} from '../mocks/project';

describe('actions', () => {
  const projectMock = generateMockContent();

  const sender = {send: jest.fn()};

  const content: ProjectContent = {
    version: {major: 1, minor: 0, patch: 0},
    metadata: {name: projectMock.name},
    state: {sessionId: projectMock.sessionId, clipId: projectMock.clipId},
    clips: [],
    groups: [],
  };
  beforeEach(() => {
    Project.instance.loadContent(content);
    jest
      .spyOn(MainApplication.instance, 'reloadMenuItems')
      .mockImplementation();
  });

  describe('audio_analysis', () => {
    const testAction = 'audio_analysis';
    const silent = true;
    const files = _.times(2, n => {
      const originalAudioFilePath = path.join(
        projectMock.mocksPath,
        `audio_${n + 1}.wav`,
      );
      return {
        clipId: projectMock.clipId,
        path: originalAudioFilePath,
        settings: mockedSettings,
      };
    });

    beforeEach(() => {
      jest
        .spyOn(HapticsSdk, 'executeOath')
        .mockReturnValue({waveform: mockedSvg, result: mockDataModel});
      jest.spyOn(Project.instance, 'addOrUpdateClip').mockReturnValue();
      jest
        .spyOn(Project.instance, 'getState')
        .mockReturnValue({sessionId: projectMock.sessionId, clipId: ''});
      jest.spyOn(Configs.instance, 'addRecentProject').mockReturnValue();
      jest.spyOn(Configs.instance, 'setCurrentProject').mockReturnValue();
      jest.spyOn(Configs.instance, 'getCurrentProject').mockReturnValue({
        name: projectMock.name,
        tmpProjectFile: projectMock.tmpProjectFile,
        dirty: false,
      });
      files.forEach(f => fs.writeFileSync(f.path, 'A'));
    });

    afterEach(async () => {
      // clear project dir
      files.forEach(f => {
        if (fs.existsSync(f.path)) {
          fs.unlinkSync(f.path);
        }
      });
      const rm = promisify(rimraf);
      await rm(projectMock.projectDir);
    });

    describe('with missing audio file', () => {
      beforeEach(async () => {
        const missingFiles = [
          {
            clipId: projectMock.clipId,
            path: '/missing/path',
            settings: mockedSettings,
          },
        ];
        await Actions.analyzeFiles(
          sender as any,
          testAction,
          missingFiles,
          silent,
        );
      });

      it('should send error messages', () => {
        expect(sender.send).toHaveBeenCalledTimes(2);
      });

      it('should send missing_audio_file message', () => {
        expect(sender.send).toHaveBeenCalledWith(
          'missing_audio_file',
          expect.anything(),
        );
      });
    });

    describe('with audio file longer than limits', () => {
      beforeEach(async () => {
        jest
          .spyOn(Utils, 'getMediaMetadata')
          .mockReturnValue(Promise.resolve({duration: 1000, channels: 2}));
        await Actions.analyzeFiles(sender as any, testAction, files, silent);
      });

      it('should send error messages', () => {
        expect(sender.send).toHaveBeenCalledTimes(2);
      });
    });

    describe('with new haptics', () => {
      beforeEach(async () => {
        jest
          .spyOn(Utils, 'verifyAudioFile')
          .mockReturnValue(Promise.resolve({duration: 1, channels: 2}));
        await Actions.analyzeFiles(sender as any, testAction, files, silent);
      });

      it('should reload menu items', () => {
        expect(MainApplication.instance.reloadMenuItems).toHaveBeenCalledTimes(
          1,
        );
      });

      it('should send responses', () => {
        expect(sender.send).toHaveBeenCalledTimes(2);
        expect(sender.send).toHaveBeenCalledWith(testAction, {
          status: 'ok',
          action: testAction,
          payload: {
            audio: {
              path: path.join(projectMock.mocksPath, 'audio_1.wav'),
              exists: true,
              channels: 2,
            },
            name: 'audio_1',
            svg: mockedSvg,
            haptic: mockDataModel,
            settings: mockedSettings,
            clipId: projectMock.clipId,
            sessionId: projectMock.sessionId,
          },
        });
        expect(sender.send).toHaveBeenCalledWith(testAction, {
          status: 'ok',
          action: testAction,
          payload: {
            audio: {
              path: path.join(projectMock.mocksPath, 'audio_2.wav'),
              exists: true,
              channels: 2,
            },
            name: 'audio_2',
            svg: mockedSvg,
            haptic: mockDataModel,
            settings: mockedSettings,
            clipId: projectMock.clipId,
            sessionId: projectMock.sessionId,
          },
        });
      });
    });
  });

  describe('update_audio_analysis', () => {
    const testAction = 'update_audio_analysis';

    const files = [
      {
        clipId: projectMock.clipId,
        path: path.join(projectMock.mocksPath, 'audio_1.wav'),
        settings: mockedSettings,
      },
    ];

    beforeEach(() => {
      jest
        .spyOn(Utils, 'verifyAudioFile')
        .mockReturnValue(Promise.resolve({duration: 1, channels: 2}));
      jest.spyOn(Project.instance, 'addOrUpdateClip').mockReturnValue();
      jest
        .spyOn(Project.instance, 'getState')
        .mockReturnValue({sessionId: projectMock.sessionId, clipId: ''});
      jest.spyOn(Configs.instance, 'addRecentProject').mockReturnValue();
      jest.spyOn(Configs.instance, 'setCurrentProject').mockReturnValue();
      jest.spyOn(Project.instance, 'getClipById').mockReturnValue({
        clipId: projectMock.clipId,
        name: 'audio_1',
        audioAsset: {
          path: path.join(projectMock.mocksPath, 'audio_1.wav'),
        },
        waveform: mockedSvg,
        haptic: mockDataModel,
        settings: mockedSettings,
      });
      jest.spyOn(Configs.instance, 'getCurrentProject').mockReturnValue({
        name: projectMock.name,
        tmpProjectFile: projectMock.tmpProjectFile,
        dirty: false,
      });
      files.forEach(f => fs.writeFileSync(f.path, 'A'));
    });

    afterEach(async () => {
      // Clear project dir
      files.forEach(f => {
        if (fs.existsSync(f.path)) {
          fs.unlinkSync(f.path);
        }
      });
      const rm = promisify(rimraf);
      await rm(projectMock.projectDir);
    });

    describe('with an existing audio file', () => {
      beforeEach(async () => {
        jest.spyOn(HapticsSdk, 'updateAmplitudeEnvelope').mockReturnValue([
          {
            time: 0.0,
            amplitude: 0.5,
          },
          {
            time: 1.0,
            amplitude: 1.0,
          },
        ]);
        jest.spyOn(HapticsSdk, 'updateFrequencyEnvelope').mockReturnValue([
          {
            time: 0.0,
            frequency: 0.5,
          },
          {
            time: 1.0,
            frequency: 1.0,
          },
        ]);
        await Actions.updateAnalysis(
          sender as any,
          testAction,
          projectMock.clipId,
          mockedSettings,
          'amplitude',
        );
      });

      it('should update the haptic data with only the changed group', () => {
        const updatedHapticData = _.cloneDeep(mockDataModel);
        updatedHapticData.signals.continuous.envelopes.amplitude = [
          {
            time: 0.0,
            amplitude: 0.5,
          },
          {
            time: 1.0,
            amplitude: 1.0,
          },
        ];

        expect(sender.send).toHaveBeenCalledWith(testAction, {
          status: 'ok',
          action: testAction,
          payload: {
            clipId: projectMock.clipId,
            haptic: updatedHapticData,
            settings: mockedSettings,
            group: 'amplitude',
          },
        });
      });
    });
  });
});
