/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';
import faker from 'faker';

import {Clip, ProjectContent} from '../../src/common/project';
import Constants from '../../src/common/constants';
import mockedSettings from '../mocks/settings';
import mockedSvg from '../mocks/svg';
import mockedDatamodel from './datamodel';

export const generateRandomClip = (params: {
  id?: string;
  name?: string;
}): Clip => {
  const {id = faker.datatype.uuid(), name = faker.commerce.product()} = params;
  return {
    clipId: id,
    name,
    audioAsset: {path: ''},
    haptic: mockedDatamodel,
    settings: mockedSettings,
    waveform: mockedSvg,
  };
};

/**
 * Generates an object with all the information needed to create and handle a mock project file
 */
export const generateMockContent = (): {
  name: string;
  filename: string;
  sessionId: string;
  clipId: string;
  deviceId: string;
  tmpPath: string;
  tmpDir: string;
  projectDir: string;
  audioFilePath: string;
  projectFile: string;
  tmpProjectFile: string;
  tutorialProjectFile: string;
  clip: Clip;
  defautProjectContent: ProjectContent;
  tutorialFileContent: ProjectContent;
  mocksPath: string;
} => {
  const name = faker.commerce.productName();
  const filename = faker.system.fileName();
  const sessionId = faker.datatype.uuid();
  const deviceId = faker.datatype.uuid();
  const clipId = faker.datatype.uuid();
  const tmpPath = path.join(path.resolve(__dirname), '..', 'tmp');
  const projectDir = path.join(tmpPath, name);
  const audioFilePath = path.join(projectDir, filename);
  const tmpDir = path.join(tmpPath, 'tmp');
  const tmpProjectFile = path.join(
    tmpPath,
    `${name}${Constants.PROJECT.EXTENSION}`,
  );
  const projectFile = path.join(
    projectDir,
    `${name}${Constants.PROJECT.EXTENSION}`,
  );
  const tutorialProjectFile = path.join(
    projectDir,
    `${Constants.PROJECT.TUTORIAL_PREFIX}${name}${Constants.PROJECT.EXTENSION}`,
  );
  const mocksPath = path.join(path.resolve(__dirname), '..', 'tmp');

  const clip: Clip = generateRandomClip({id: clipId, name});

  const defautProjectContent: ProjectContent = {
    version: {major: 1, minor: 0, patch: 0},
    metadata: {name},
    state: {clipId, sessionId},
    clips: [clip],
    groups: [],
  };

  const tutorialFileContent: ProjectContent = {
    version: {major: 1, minor: 0, patch: 0},
    state: {sessionId, clipId: ''},
    metadata: {name, slug: 'tutorial-1', version: '1.0.0'},
    clips: [],
    groups: [],
    isTutorial: true,
  };

  return {
    name,
    filename,
    sessionId,
    clipId,
    deviceId,
    tmpPath,
    tmpDir,
    projectDir,
    audioFilePath,
    projectFile,
    tmpProjectFile,
    tutorialProjectFile,
    clip,
    defautProjectContent,
    tutorialFileContent,
    mocksPath,
  };
};
