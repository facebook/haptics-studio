/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import mockFs from 'mock-fs';
import path from 'path';
import faker from 'faker';
import fs from 'fs';
import _ from 'lodash';
import * as mm from 'music-metadata';
import {BrowserWindow} from 'electron';

import Configs, {ProjectMetadata} from '../../src/common/configs';
import {IPCMessage} from '../../src/listeners';
import listeners, {FileContent} from '../../src/listeners/files';
import {ipcRenderer, dialog} from '../mocks/electron';
import MainApplication from '../../src/application';
import {PathManager} from '../../src/services';
// import Constants from '../../src/common/constants';

describe('files listeners', () => {
  let response: IPCMessage;
  const mocksPath = path.join(path.resolve(__dirname), '..', 'samples');
  const samplesPath = path.join(path.resolve(__dirname), '..', '..', 'samples');

  beforeAll(() => {
    // setup listeners
    listeners();
  });

  describe('handleRecentProjects', () => {
    const testAction = 'recent_projects';
    const projectFile = '/path/to/projectFile';
    const recentProjects = _.times(10, () => {
      return {
        projectFile,
        name: faker.commerce.productName(),
        clipId: faker.datatype.uuid(),
        error: 'Missing project file',
      };
    });

    beforeEach(async () => {
      jest
        .spyOn(Configs.instance, 'getRecentProjects')
        .mockReturnValue(recentProjects);
      response = await ipcRenderer.invoke(testAction, {});
    });

    it('should return recent projects', () => {
      const {status, action, payload} = response;
      expect(status).toEqual('ok');
      expect(action).toEqual(testAction);
      expect(payload).toEqual({projects: recentProjects});
    });
  });

  describe('fileSelected', () => {
    const testAction = 'file_selected';
    const audioFile = path.join(mocksPath, 'audio.wav');
    const message = {file: audioFile};
    it('should return a message with status ok', async () => {
      const res = await ipcRenderer.invoke(testAction, message);
      const {status, action, payload} = res;
      expect(status).toEqual('ok');
      expect(action).toEqual(testAction);
      expect(payload).toEqual({});
    });

    it('should return a message with status ok with mp3 files', async () => {
      const mp3 = path.join(mocksPath, 'audio.mp3');
      const res = await ipcRenderer.invoke(testAction, {file: mp3});
      const {status, action, payload} = res;
      expect(status).toEqual('ok');
      expect(action).toEqual(testAction);
      expect(payload).toEqual({});
    });

    it('should return a message with status ok with ogg files', async () => {
      const mp3 = path.join(mocksPath, 'audio.ogg');
      const res = await ipcRenderer.invoke(testAction, {file: mp3});
      const {status, action, payload} = res;
      expect(status).toEqual('ok');
      expect(action).toEqual(testAction);
      expect(payload).toEqual({});
    });

    it('should return a message with status ok with aiff files', async () => {
      const aiff = path.join(mocksPath, 'audio.aiff');
      const res = await ipcRenderer.invoke(testAction, {file: aiff});
      const {status, action, payload} = res;
      expect(status).toEqual('ok');
      expect(action).toEqual(testAction);
      expect(payload).toEqual({});
    });

    describe('with audio file longer than limits', () => {
      beforeEach(async () => {
        jest.spyOn(mm, 'parseFile').mockReturnValue(
          Promise.resolve({
            format: {duration: 1000},
          } as any as mm.IAudioMetadata),
        );
        response = await ipcRenderer.invoke(testAction, message);
      });

      it('should return an error message', () => {
        const {status} = response;
        expect(status).toEqual('error');
      });
    });

    describe('with audio file bigger than limits', () => {
      beforeEach(async () => {
        jest.spyOn(mm, 'parseFile').mockReturnValue(
          Promise.resolve({
            format: {duration: 500},
          } as any as mm.IAudioMetadata),
        );
        mockFs({
          [audioFile]: Buffer.from(
            _.times(20 * 2 ** 20, () => {
              return 'A';
            }).join(''),
          ),
        });
        response = await ipcRenderer.invoke(testAction, message);
      });

      afterEach(() => {
        mockFs.restore();
      });

      it('should return an error message', () => {
        const {status} = response;
        expect(status).toEqual('error');
      });
    });
  });

  describe('handleSamples', () => {
    const testAction = 'samples';

    describe('with metadata file', () => {
      beforeEach(async () => {
        response = await ipcRenderer.invoke(testAction, {});
      });

      it('should return ok', () => {
        const {status, action} = response;
        expect(status).toEqual('ok');
        expect(action).toEqual(testAction);
      });

      it('should return samples projects with slug, category and description', () => {
        const {payload} = response as unknown as {
          payload: {samples: ProjectMetadata[]};
        };

        const keys = Object.keys(payload.samples[0]);
        expect(keys).toEqual(
          expect.arrayContaining([
            'slug',
            'category',
            'description',
            'version',
          ]),
        );
      });

      it('should return paths that starts with samples folder', () => {
        const {payload} = response as unknown as {
          payload: {samples: ProjectMetadata[]};
        };
        expect(
          payload.samples[0]?.projectFile?.startsWith(
            PathManager.instance.getSamplesPath(),
          ),
        ).toBeTruthy();
      });

      it('should return the prioritized samples first', () => {
        const {payload} = response as unknown as {
          payload: {samples: ProjectMetadata[]};
        };
        interface Priority {
          priority: number;
          new: boolean;
        }
        const priorities: {[key: string]: Priority} = JSON.parse(
          fs.readFileSync(path.join(samplesPath, 'priority.json'), 'utf8'),
        );
        const sampleNames = Object.keys(priorities).map(k => ({
          key: k,
          order: priorities[k].priority,
        }));
        expect(payload.samples[0].name.toLowerCase()).toEqual(
          sampleNames.sort((a, b) => a.order - b.order)[0].key.toLowerCase(),
        );
      });
    });
  });

  describe('add files', () => {
    const testAction = 'add_files';
    beforeEach(async () => {
      jest
        .spyOn(MainApplication.instance, 'getMainWindow')
        .mockReturnValue({} as unknown as BrowserWindow);
      jest.spyOn(Configs.instance, 'getRecentProjects').mockReturnValue([]);
      jest
        .spyOn(dialog, 'showOpenDialogSync')
        .mockReturnValue([
          path.join(mocksPath, 'folder1'),
          path.join(mocksPath, 'folder3', 'folder4', 'file4.wav'),
        ]);
      mockFs({
        [path.join(mocksPath, 'file1.wav')]: Buffer.from('A'),
        [path.join(mocksPath, 'file1.txt')]: Buffer.from('A'),
        [path.join(mocksPath, 'file1.pdf')]: Buffer.from('A'),
        [path.join(mocksPath, 'folder1', 'file2.wav')]: Buffer.from('A'),
        [path.join(mocksPath, 'folder1', 'file2.txt')]: Buffer.from('A'),
        [path.join(mocksPath, 'folder1', 'folder2', 'file3.mp3')]:
          Buffer.from('A'),
        [path.join(mocksPath, 'folder1', 'folder2', 'file3.txt')]:
          Buffer.from('A'),
        [path.join(mocksPath, 'folder3', 'folder4', 'file4.wav')]:
          Buffer.from('A'),
      });

      response = await ipcRenderer.invoke(testAction);
    });

    afterEach(() => {
      mockFs.restore();
    });

    it('should return the list of wav files', () => {
      const files: FileContent[] = [
        {path: path.join(mocksPath, 'folder1', 'file2.wav'), name: 'file2.wav'},
        {
          path: path.join(mocksPath, 'folder1', 'folder2', 'file3.mp3'),
          name: 'file3.mp3',
        },
        {
          path: path.join(mocksPath, 'folder3', 'folder4', 'file4.wav'),
          name: 'file4.wav',
        },
      ];
      const expectedOutput = {files};
      expect(response.payload).toEqual(expectedOutput);
    });
  });
});
