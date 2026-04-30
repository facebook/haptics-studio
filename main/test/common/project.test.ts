/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs from 'fs';

import Project from '../../src/common/project';
import {generateMockContent} from '../mocks/project';
import Configs from '../../src/common/configs';

const projectMock = generateMockContent();

describe('project', () => {
  afterAll(() => {
    fs.rmSync(projectMock.projectDir, {recursive: true});
  });

  describe('save', () => {
    describe('when the project content is null', () => {
      it('should return false', async () => {
        Project.instance.loadContent(undefined);
        expect(await Project.instance.save(projectMock.projectFile)).toBe(
          false,
        );
      });
    });

    describe('when the project content is valid', () => {
      it('should return true', async () => {
        Project.instance.create('test');
        Project.instance.loadContent(projectMock.defautProjectContent);
        fs.mkdirSync(projectMock.projectDir, {recursive: true});
        expect(await Project.instance.save(projectMock.projectFile)).toBe(true);
      });

      it('should update the project version to match the current app version', async () => {
        jest.spyOn(Configs.instance, 'getAppVersion').mockReturnValue({
          major: 1,
          minor: 2,
          patch: 3,
        });
        await Project.instance.save(projectMock.projectFile);
        expect(Project.instance.getVersion()).toEqual({
          major: 1,
          minor: 2,
          patch: 3,
        });
      });
    });
  });

  describe('load', () => {
    describe('when the project is not temporary', () => {
      beforeEach(() => {
        fs.writeFileSync(
          projectMock.projectFile,
          JSON.stringify(projectMock.defautProjectContent),
        );
      });

      it('should update the version if needed', async () => {
        jest.spyOn(Configs.instance, 'getAppVersion').mockReturnValue({
          major: 1,
          minor: 2,
          patch: 3,
        });
        await Project.instance.load(projectMock.projectFile);
        expect(Project.instance.getVersion()).toEqual({
          major: 1,
          minor: 2,
          patch: 3,
        });
      });
    });

    describe('when the project is a major version up', () => {
      beforeEach(() => {
        const newerVersion = {...projectMock.defautProjectContent};
        newerVersion.version = {
          major: projectMock.defautProjectContent.version.major + 1,
          minor: 0,
          patch: 0,
        };
        fs.writeFileSync(projectMock.projectFile, JSON.stringify(newerVersion));
        jest.spyOn(Configs.instance, 'getAppVersion').mockReturnValue({
          major: 1,
          minor: 0,
          patch: 0,
        });
      });
      it('should return an error', async () => {
        await expect(
          Project.instance.load(projectMock.projectFile),
        ).rejects.toThrow();
      });
    });
  });
});
