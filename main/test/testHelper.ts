/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import rimraf from 'rimraf';
import fs from 'fs';
import path from 'path';
import {promisify} from 'util';

import Configs from '../src/common/configs';
import * as AxiosMocks from './mocks/axios';
import {PathManager} from '../src/services';

function initConfigFile(environment: string): void {
  const mainPath = path.join(path.resolve(__dirname), '..');
  const configPath = path.join(mainPath, 'configs');
  const configFile = path.join(configPath, `configs.${environment}.json`);
  const exampleConfigFile = path.join(
    configPath,
    `configs.${environment}.json.example`,
  );
  if (!fs.existsSync(configFile) && fs.existsSync(exampleConfigFile)) {
    fs.copyFileSync(exampleConfigFile, configFile);
  }
}

function clearConfigFile(environment: string): void {
  const mainPath = path.join(path.resolve(__dirname), '..');
  const configPath = path.join(mainPath, 'configs');
  const configFile = path.join(configPath, `configs.${environment}.json`);
  if (fs.existsSync(configFile)) {
    fs.unlinkSync(configFile);
  }
}

beforeEach(async () => {
  const mainPath = path.join(path.resolve(__dirname), '..');
  const spyResourcesPath = jest.spyOn(PathManager.instance, 'getResourcesPath');
  spyResourcesPath.mockReturnValue(mainPath);
  const spyDataPath = jest.spyOn(PathManager.instance, 'getDataPath');
  spyDataPath.mockReturnValue(mainPath);
  const spyApplicationPath = jest.spyOn(
    PathManager.instance,
    'getApplicationPath',
  );
  spyApplicationPath.mockReturnValue(mainPath);
  const spyDistPath = jest.spyOn(PathManager.instance, 'getDistPath');
  spyDistPath.mockReturnValue(mainPath);
  const spyHomePath = jest.spyOn(PathManager.instance, 'getHomePath');
  spyHomePath.mockReturnValue(mainPath);
  const spySamplesPath = jest.spyOn(PathManager.instance, 'getSamplesPath');
  spySamplesPath.mockReturnValue(path.join(mainPath, 'samples'));
  initConfigFile(process.env.NODE_ENV || 'test');
  await Configs.instance.load();
  Configs.configs.app.tmpPath = path.join(path.resolve(__dirname), 'tmp');
  AxiosMocks.mockAnalytics();
});

afterEach(() => {
  clearConfigFile(process.env.NODE_ENV || 'test');
  AxiosMocks.resetMocks();
});

afterAll(async () => {
  const rm = promisify(rimraf);
  const tmpPath = path.join(path.resolve(__dirname), 'tmp', '*');
  await rm(tmpPath);
});
