/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {dialog} from 'electron';
import {isNil} from 'lodash';
import path from 'path';
import fs from 'fs';
import {getAudioFiles, getProjectToOpen} from '../common/utils';

import Configs from '../common/configs';
import {IPCMessage} from '../listeners';
import MainApplication from '../application';
import {PathManager} from '../services';
import {FileContent} from '../listeners/files';
import Logger from '../common/logger';
import Constants from '../common/constants';
import {loadProject} from './project';

export function addFiles(
  action: string,
  properties: Array<'openDirectory' | 'openFile'> = [
    'openDirectory',
    'openFile',
  ],
): IPCMessage {
  let response: IPCMessage = {action, status: 'ok', payload: {}};
  try {
    const files: FileContent[] = [];
    const window = MainApplication.instance.getMainWindow();
    const [lastProject] = Configs.instance.getRecentProjects();
    if (!window) {
      return response;
    }
    const selectedPaths = dialog.showOpenDialogSync(window, {
      title: 'Select files',
      defaultPath: lastProject
        ? path.dirname(lastProject.projectFile ?? '')
        : PathManager.instance.getHomePath(),
      properties: [...properties, 'multiSelections'],
      filters: [
        {
          name: 'Supported Files',
          extensions: [
            ...Constants.PROJECT.SUPPORTED_AUDIO_EXTENSIONS.map(s =>
              s.replace('.', ''),
            ),
            'haptic',
          ],
        },
      ],
    });
    if (isNil(selectedPaths)) {
      return response;
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const selectedPath of selectedPaths) {
      const isDirectory = fs.lstatSync(selectedPath).isDirectory();
      if (isDirectory) {
        const dirFiles = getAudioFiles(selectedPath).map(f => {
          return {path: f, name: path.basename(f)};
        });
        files.push(...dirFiles);
      } else {
        files.push({path: selectedPath, name: path.basename(selectedPath)});
      }
    }
    response.payload = {files};
  } catch (error) {
    const err = error as Error;
    Logger.error(err.message, err.stack);
    response = {action, status: 'error', message: err.message};
  }
  return response;
}

export async function openProject(): Promise<void> {
  const returnValue = await dialog.showOpenDialog({
    title: 'Open Project',
    properties: ['openFile'],
    defaultPath: PathManager.instance.getHomePath(),
    filters: [
      {
        name: 'Haptic Project File',
        extensions: [
          ...Constants.PROJECT.SUPPORTED_EXTENSIONS.map(s =>
            s.replace('.', ''),
          ),
        ],
      },
    ],
  });
  const {canceled, filePaths} = returnValue;
  if (!canceled) {
    const [filePath] = filePaths;
    const {projectToOpen, isDirty} = getProjectToOpen(filePath);
    const action = 'open';
    const message = await loadProject(action, projectToOpen, isDirty);
    MainApplication.instance.sendToUI(action, message);
  }
}
