/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import rimraf from 'rimraf';
import {promisify} from 'util';
import fs from 'fs';
import path from 'path';
import faker from 'faker';

import Project, {ProjectContent, Clip, ClipInfo} from '../src/common/project';
import Constants from '../src/common/constants';
import Configs from '../src/common/configs';
import mockDataModel from './mocks/datamodel';
import mockSettings from './mocks/settings';
import mockSvg from './mocks/svg';
import {loadJSONFile} from '../src/common/utils';
import {generateMockContent} from './mocks/project';

describe('project', () => {
  const projectMock = generateMockContent();

  let projectFilePath: string;

  beforeEach(() => {
    const {app} = Configs.configs;
    projectFilePath = path.join(
      projectMock.projectDir,
      `${projectMock.name}${app.projectFile.extension}`,
    );
    fs.mkdirSync(projectMock.projectDir);
  });

  afterEach(async () => {
    // clear project dir
    const rm = promisify(rimraf);
    await rm(projectMock.projectDir);
  });

  describe('load', () => {
    describe('when the project file does not exist', () => {
      it('should set the content as undefined', async () => {
        await Project.instance.load(projectFilePath);
        expect(Project.instance.hasContent()).toBeFalsy();
      });
    });
    describe('when the project file exists', () => {
      beforeEach(() => {
        fs.writeFileSync(
          projectFilePath,
          JSON.stringify(projectMock.defautProjectContent, undefined, 2),
        );
      });
      it('should load the project file content', async () => {
        await Project.instance.load(projectFilePath);
        expect(Project.instance.getClips().length).toEqual(
          projectMock.defautProjectContent.clips.length,
        );
      });
      it('should set the project as the project file name', async () => {
        await Project.instance.load(projectFilePath);
        expect(Project.instance.getMetadata().name).toEqual(
          path.dirname(projectFilePath).split(path.sep).pop(),
        );
      });
    });
    describe('when the project has associated assets', () => {
      beforeEach(() => {
        fs.mkdirSync(
          path.join(
            path.dirname(projectFilePath),
            Constants.PROJECT.TUTORIAL_ASSETS_FOLDER,
          ),
        );
        fs.writeFileSync(
          path.join(
            path.dirname(projectFilePath),
            Constants.PROJECT.TUTORIAL_ASSETS_FOLDER,
            'image.png',
          ),
          '',
        );
      });
      it('should copy the assets in the temp dir', async () => {
        const {app} = Configs.configs;
        const projectName = path.basename(
          projectFilePath,
          app.projectFile.extension,
        );
        const tmpProjectDir = path.join(app.tmpPath, projectName);
        await Project.instance.load(projectFilePath);
        const exists = fs.existsSync(
          path.join(
            tmpProjectDir,
            Constants.PROJECT.TUTORIAL_ASSETS_FOLDER,
            'image.png',
          ),
        );
        expect(exists).toBeTruthy();
      });
    });
  });

  describe('save', () => {
    describe('with empty content', () => {
      beforeEach(() => {
        Project.instance.loadContent(undefined);
      });
      it('should return false', async () => {
        const res = await Project.instance.save(projectFilePath);
        expect(res).toBeFalsy();
      });
    });
    describe('with content', () => {
      beforeEach(() => {
        Project.instance.create(projectMock.name);
        fs.writeFileSync(
          Project.instance.getProjectFile(),
          JSON.stringify(projectMock.defautProjectContent, undefined, 2),
        );
      });
      it('should save the content to the project file', async () => {
        const res = await Project.instance.save(projectFilePath);
        const content = loadJSONFile<ProjectContent>(projectFilePath);
        expect(content.state?.sessionId).toEqual(expect.any(String));
        expect(res).toBeTruthy();
      });
    });
  });

  describe('create', () => {
    it('should create the project file', () => {
      Project.instance.create(projectMock.name);
      expect(Project.instance.getName()).toEqual(projectMock.name);
      expect(Project.instance.getState().sessionId).toEqual(expect.any(String));
    });
  });

  describe('updateState', () => {
    beforeEach(() => {
      Project.instance.create(projectMock.name);
      Project.instance.updateState(projectMock.clipId, projectMock.sessionId);
    });

    it('should update the state object', () => {
      const state = Project.instance.getState();
      expect(state.clipId).toEqual(projectMock.clipId);
      expect(state.sessionId).toEqual(projectMock.sessionId);
    });

    it('should set content as updated', () => {
      expect(Project.instance.getUpdatedAt()).not.toBeUndefined();
    });
  });

  describe('getCurrentClip', () => {
    describe('with empty content', () => {
      it('should return undefined', () => {
        const res = Project.instance.getCurrentClip();
        expect(res).toBeUndefined();
      });
    });

    describe('with content', () => {
      beforeEach(() => {
        Project.instance.loadContent({
          ...projectMock.defautProjectContent,
          clips: [projectMock.clip],
          state: {clipId: projectMock.clipId, sessionId: projectMock.sessionId},
        });
      });

      afterEach(() => {
        Project.instance.loadContent(undefined);
      });

      it('should return the current clip', () => {
        const res = Project.instance.getCurrentClip();
        expect(res).toEqual(projectMock.clip);
      });
    });
  });

  describe('addOrUpdateClip', () => {
    const newClipId = faker.datatype.uuid();
    const clipInfo: ClipInfo = {
      name: 'New Clip',
      audio: {
        path: projectMock.audioFilePath,
      },
      haptic: mockDataModel,
      svg: mockSvg,
      settings: mockSettings,
      clipId: newClipId,
    };

    beforeEach(() => {
      Project.instance.loadContent(projectMock.defautProjectContent);
    });

    afterEach(() => {
      Project.instance.loadContent(undefined);
    });

    it('should add the clip to the project if the clip is new', () => {
      Project.instance.addOrUpdateClip(clipInfo);
      const newClip: Clip = {
        clipId: newClipId,
        name: 'New Clip',
        audioAsset: {
          path: projectMock.audioFilePath,
          channels: 1,
        },
        haptic: mockDataModel,
        waveform: mockSvg,
        settings: mockSettings,
        lastUpdate: expect.any(Number),
      };
      expect(Project.instance.getClips()[1]).toEqual(newClip);
    });

    it('should set project as updated', () => {
      Project.instance.addOrUpdateClip(clipInfo);
      expect(Project.instance.getUpdatedAt()).not.toBeUndefined();
    });
  });

  describe('getProjectError', () => {
    describe('when project file is missing', () => {
      it('should return a proper error', () => {
        expect(
          Project.getProjectError({
            projectFile: '/wrong/path',
            name: 'wrong name',
          }),
        ).toEqual('Missing project file');
      });
    });

    describe('when the project file is valid', () => {
      beforeEach(() => {
        fs.writeFileSync(
          projectFilePath,
          JSON.stringify(projectMock.defautProjectContent, undefined, 2),
        );
      });
      it('should return undefined', () => {
        expect(
          Project.getProjectError({
            projectFile: projectFilePath,
            name: projectMock.name,
          }),
        ).toEqual(undefined);
      });
    });
  });
});
