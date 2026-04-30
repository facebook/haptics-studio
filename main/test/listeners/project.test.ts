/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-restricted-syntax */
/* eslint-disable @typescript-eslint/unbound-method */
import path from 'path';
import fs from 'fs';
import faker from 'faker';
import _ from 'lodash';
import {BrowserWindow} from 'electron';

import * as ProjectActions from '../../src/actions/project';
import Project, {ClipGroup} from '../../src/common/project';
import Configs, {
  CurrentProject,
  ProjectMetadata,
} from '../../src/common/configs';
import * as Utils from '../../src/common/utils';
import {IPCMessage} from '../../src/listeners';
import listeners from '../../src/listeners/project';
import {ipcRenderer, dialog} from '../mocks/electron';
import MainApplication from '../../src/application';
import Constants from '../../src/common/constants';
import WSServer from '../../src/wsServer';
import {generateMockContent} from '../mocks/project';

describe('project listeners', () => {
  const projectMock = generateMockContent();

  let response: IPCMessage;

  beforeAll(() => {
    // setup listeners
    listeners();
    fs.mkdirSync(projectMock.projectDir);
  });

  beforeEach(() => {
    jest
      .spyOn(MainApplication.instance, 'reloadMenuItems')
      .mockImplementation();
  });

  describe('open', () => {
    const testAction = 'open';
    const projectFile = '/path/to/projectFile';
    const message: ProjectMetadata = {
      name: projectMock.name,
      projectFile,
    };

    beforeEach(async () => {
      jest.spyOn(ProjectActions, 'loadProject').mockImplementation(async () => {
        return Promise.resolve({action: testAction, status: 'ok', payload: {}});
      });
      response = (await ipcRenderer.invoke(testAction, message)) as IPCMessage;
    });

    it('should call loadProject once', () => {
      expect(ProjectActions.loadProject).toHaveBeenCalledTimes(1);
      expect(ProjectActions.loadProject).toHaveBeenCalledWith(
        testAction,
        projectFile,
      );
    });

    it('returns an IPCMessage', () => {
      const {status, action} = response;
      expect(status).toEqual('ok');
      expect(action).toEqual(testAction);
      expect(response).toHaveProperty('payload');
    });
  });

  describe('load_current_project', () => {
    const testAction = 'load_current_project';

    beforeEach(() => {
      jest.spyOn(ProjectActions, 'loadProject').mockReturnValue(
        Promise.resolve({
          status: 'ok',
          action: testAction,
          payload: {},
        }),
      );
    });

    describe('when the current project is empty', () => {
      beforeEach(async () => {
        jest
          .spyOn(Configs.instance, 'clearCurrentProject')
          .mockImplementation();
        jest
          .spyOn(Configs.instance, 'hasCurrentProject')
          .mockReturnValue(false);
        jest
          .spyOn(Configs.instance, 'getCurrentProject')
          .mockReturnValue({} as unknown as CurrentProject);
        response = (await ipcRenderer.invoke(testAction, {})) as IPCMessage;
      });

      it('should return an ok message', () => {
        const {status, action} = response;
        expect(status).toEqual('ok');
        expect(action).toEqual(testAction);
      });

      it('should not call loadProject', () => {
        expect(ProjectActions.loadProject).toHaveBeenCalledTimes(0);
      });
    });

    describe('when the the project is missing', () => {
      beforeEach(async () => {
        jest
          .spyOn(Configs.instance, 'clearCurrentProject')
          .mockImplementation();
        jest.spyOn(Configs.instance, 'hasCurrentProject').mockReturnValue(true);
        jest
          .spyOn(Configs.instance, 'getCurrentProject')
          .mockReturnValue({} as unknown as CurrentProject);
        response = (await ipcRenderer.invoke(testAction, {})) as IPCMessage;
      });

      it('should return an ok message', () => {
        const {status, action} = response;
        expect(status).toEqual('ok');
        expect(action).toEqual(testAction);
      });

      it('should not call loadProject', () => {
        expect(ProjectActions.loadProject).toHaveBeenCalledTimes(0);
      });

      it('should call clearCurrentProject once', () => {
        expect(Configs.instance.clearCurrentProject).toHaveBeenCalledTimes(1);
      });
    });

    describe('when the project exist', () => {
      const projectFile = path.join(
        projectMock.tmpPath,
        `${projectMock.name}${Constants.PROJECT.EXTENSION}`,
      );

      beforeEach(async () => {
        jest.spyOn(Configs.instance, 'hasCurrentProject').mockReturnValue(true);
        jest
          .spyOn(Configs.instance, 'getCurrentProjectFile')
          .mockReturnValue(projectMock.tmpProjectFile);
        jest.spyOn(Configs.instance, 'getCurrentProject').mockReturnValue({
          projectFile,
          dirty: false,
          name: projectMock.name,
          tmpProjectFile: projectMock.tmpProjectFile,
        });
        fs.writeFileSync(projectFile, JSON.stringify({}));
        response = (await ipcRenderer.invoke(testAction, {})) as IPCMessage;
      });

      it('should return an ok message', () => {
        const {status, action} = response;
        expect(status).toEqual('ok');
        expect(action).toEqual(testAction);
      });

      it('should call loadProject once', () => {
        expect(ProjectActions.loadProject).toHaveBeenCalledTimes(1);
        expect(ProjectActions.loadProject).toHaveBeenCalledWith(
          testAction,
          projectMock.tmpProjectFile,
          false,
        );
      });
    });
  });

  describe('update_groups', () => {
    const testAction = 'update_groups';
    const currentTime = new Date().getTime();
    const clipIds = [
      faker.datatype.uuid(),
      faker.datatype.uuid(),
      faker.datatype.uuid(),
      faker.datatype.uuid(),
    ];
    const groups: ClipGroup[] = [
      {
        id: faker.datatype.uuid(),
        isFolder: false,
        name: undefined,
        clips: [clipIds[0], clipIds[2]],
      },
      {
        id: faker.datatype.uuid(),
        isFolder: true,
        name: faker.commerce.product(),
        clips: [clipIds[1], clipIds[3]],
      },
    ];
    const payload = groups;

    beforeEach(async () => {
      Project.instance.loadContent(projectMock.defautProjectContent);
      jest.spyOn(Utils, 'now').mockReturnValue(currentTime);
      jest.spyOn(Configs.instance, 'getCurrentProject').mockReturnValue({
        name: projectMock.name,
        dirty: true,
        tmpProjectFile: projectMock.tmpProjectFile,
      });
      response = (await ipcRenderer.invoke(testAction, payload)) as IPCMessage;
    });

    it('should update the groups parameter', () => {
      expect(Project.instance.getGroups()).toEqual(groups);
    });
  });

  describe('rename_project', () => {
    const testAction = 'rename_project';
    const newProjectName = faker.commerce.product();
    const newProjectFile = path.join(
      projectMock.projectDir,
      `${newProjectName}${Constants.PROJECT.EXTENSION}`,
    );
    const payload = {name: newProjectName};

    beforeEach(() => {
      Project.instance.loadContent({...projectMock.defautProjectContent});
      fs.writeFileSync(
        projectMock.projectFile,
        JSON.stringify(projectMock.defautProjectContent, undefined, 2),
      );
      fs.writeFileSync(
        projectMock.tmpProjectFile,
        JSON.stringify(projectMock.defautProjectContent, undefined, 2),
      );
      jest.spyOn(Configs.instance, 'getCurrentProject').mockReturnValue({
        name: projectMock.name,
        dirty: true,
        tmpProjectFile: projectMock.tmpProjectFile,
        projectFile: projectMock.projectFile,
      });
      jest.spyOn(Configs.instance, 'setCurrentProject').mockReturnValue();
      jest.spyOn(Configs.instance, 'replaceRecentProject').mockReturnValue();
      jest.spyOn(WSServer.instance, 'sendCurrentProject').mockReturnValue();
    });

    afterEach(() => {
      if (fs.existsSync(newProjectFile)) {
        fs.unlinkSync(newProjectFile);
      }
    });

    describe('when the project was not previously saved', () => {
      beforeEach(async () => {
        Project.instance.loadContent(
          _.cloneDeep(projectMock.defautProjectContent),
        );
        jest.spyOn(ProjectActions, 'saveProject').mockImplementation();
        jest.spyOn(Configs.instance, 'getCurrentProject').mockReturnValue({
          name: projectMock.name,
          dirty: true,
          tmpProjectFile: projectMock.tmpProjectFile,
        });
        response = (await ipcRenderer.invoke(
          testAction,
          payload,
        )) as IPCMessage;
      });

      it('should call saveProject', () => {
        expect(ProjectActions.saveProject).toHaveBeenCalledTimes(1);
      });
    });

    describe('when the action is confirmed in the message box', () => {
      beforeEach(async () => {
        Project.instance.loadContent(
          _.cloneDeep(projectMock.defautProjectContent),
        );
        jest.spyOn(dialog, 'showMessageBoxSync').mockReturnValue(0);
        response = (await ipcRenderer.invoke(
          testAction,
          payload,
        )) as IPCMessage;
      });

      it('should update the project name', () => {
        expect(Project.instance.getMetadata().name).toEqual(newProjectName);
      });

      it('should rename the tmp project file', () => {
        expect(fs.existsSync(projectMock.tmpProjectFile)).toEqual(false);
        expect(
          fs.existsSync(
            path.join(
              projectMock.tmpPath,
              `${newProjectName}${Constants.PROJECT.EXTENSION}`,
            ),
          ),
        ).toEqual(true);
      });

      it('should rename the project file', () => {
        expect(fs.existsSync(projectMock.projectFile)).toEqual(false);
        expect(
          fs.existsSync(
            path.join(
              projectMock.projectDir,
              `${newProjectName}${Constants.PROJECT.EXTENSION}`,
            ),
          ),
        ).toEqual(true);
      });

      it('should set the new current project', () => {
        expect(Configs.instance.setCurrentProject).toHaveBeenCalledTimes(1);
        expect(Configs.instance.setCurrentProject).toHaveBeenCalledWith({
          dirty: true,
          name: newProjectName,
          tmpProjectFile: path.join(
            projectMock.tmpPath,
            `${newProjectName}${Constants.PROJECT.EXTENSION}`,
          ),
          projectFile: path.join(
            projectMock.projectDir,
            `${newProjectName}${Constants.PROJECT.EXTENSION}`,
          ),
        });
      });

      it('should send the new current project', () => {
        expect(WSServer.instance.sendCurrentProject).toHaveBeenCalledTimes(1);
      });
    });

    describe('when a file with the same name exists', () => {
      beforeEach(async () => {
        Project.instance.loadContent(
          _.cloneDeep(projectMock.defautProjectContent),
        );
        fs.writeFileSync(
          newProjectFile,
          JSON.stringify(projectMock.defautProjectContent, undefined, 2),
        );
        jest.spyOn(dialog, 'showMessageBoxSync').mockReturnValue(2); // Cancel overwriting prompt
        response = (await ipcRenderer.invoke(
          testAction,
          payload,
        )) as IPCMessage;
      });

      it('should not update the project name', () => {
        expect(Project.instance.getMetadata().name).toEqual(projectMock.name);
      });
    });
  });

  describe('update_metadata', () => {
    const testAction = 'update_metadata';
    const metadata = {
      description: 'description',
      slug: 'test',
      category: 'new-category',
      version: '1.0.0',
    };

    beforeEach(async () => {
      Project.instance.loadContent({...projectMock.defautProjectContent});
      jest.spyOn(Configs.instance, 'getCurrentProject').mockReturnValue({
        name: projectMock.name,
        dirty: true,
        tmpProjectFile: projectMock.tmpProjectFile,
        projectFile: projectMock.projectFile,
      });
      response = (await ipcRenderer.invoke(testAction, metadata)) as IPCMessage;
    });

    it('should return an ok message', () => {
      expect(response.status).toEqual('ok');
    });

    it('should update the project metadata', () => {
      expect(Project.instance.getMetadata()).toEqual({
        name: projectMock.name,
        ...metadata,
      });
    });
  });

  describe('new_project', () => {
    const testAction = 'new_project';

    beforeEach(() => {
      Project.instance.loadContent({...projectMock.defautProjectContent});
      fs.writeFileSync(
        projectMock.projectFile,
        JSON.stringify(projectMock.defautProjectContent, undefined, 2),
      );
      fs.writeFileSync(
        projectMock.tmpProjectFile,
        JSON.stringify(projectMock.defautProjectContent, undefined, 2),
      );
      jest.spyOn(Configs.instance, 'getCurrentProject').mockReturnValue({
        name: projectMock.name,
        dirty: true,
        tmpProjectFile: projectMock.tmpProjectFile,
        projectFile: projectMock.projectFile,
      });
      jest
        .spyOn(Configs.instance, 'clearCurrentProject')
        .mockImplementation(() => {
          Project.instance.close();
        });
      jest.spyOn(WSServer.instance, 'sendCurrentProject').mockReturnValue();
      jest
        .spyOn(MainApplication.instance, 'getMainWindow')
        .mockReturnValue({} as unknown as BrowserWindow);
    });

    describe('when the dialog is canceled', () => {
      beforeEach(async () => {
        jest.spyOn(dialog, 'showMessageBoxSync').mockReturnValue(2);
        response = (await ipcRenderer.invoke(testAction, {})) as IPCMessage;
      });

      it('should keep the orignal project', () => {
        expect(Project.instance.getClips().length).toEqual(1);
      });
    });

    describe('when the dialog is confirmed', () => {
      beforeEach(async () => {
        jest.spyOn(dialog, 'showMessageBoxSync').mockReturnValue(0);
        response = (await ipcRenderer.invoke(testAction, {})) as IPCMessage;
      });

      it('should create an empty project', () => {
        expect(Project.instance.getClips().length).toEqual(0);
      });
    });
  });
});
