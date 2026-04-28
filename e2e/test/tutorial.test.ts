/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-param-reassign */

import path from 'path';
import {
  test,
  _electron as electron,
  ElectronApplication,
  Page,
  expect,
} from '@playwright/test';
import {findLatestBuild, parseElectronApp} from 'electron-playwright-helpers';
import rimraf from 'rimraf';
import {promisify} from 'util';
import {build} from '../../package.json';
import {acceptTerms, delay} from './utils';

const latestBuild = findLatestBuild('dist');
const appInfo = parseElectronApp(latestBuild);
let electronApp: ElectronApplication;
let page: Page;
let userDataPath: string;

test.beforeEach(async () => {
  electronApp = await electron.launch({
    args: [appInfo.main, '--force-device-scale-factor=2'],
    executablePath: appInfo.executable,
  });
  page = await electronApp.firstWindow();

  const {productName} = build;

  // Clear the temp dir
  const appPath = await electronApp.evaluate(({app}) => {
    return app.getPath('appData');
  });
  userDataPath = `${path.join(appPath, productName)}-test`;

  await delay(200);
});

test.afterEach(async () => {
  await electronApp.close();
  await delay(100);
  await promisify(rimraf)(userDataPath);
});

test.describe('tutorial project', () => {
  test('user should be able to load the tutorial', async () => {
    await acceptTerms(page);

    await page.getByRole('menuitem', {name: 'Learning'}).click();
    await page.getByText('The Basics of Haptic Design').click();
    expect(await page.getByText('Tutorial').count()).toBeGreaterThanOrEqual(1);
    await expect(page).toHaveScreenshot({maxDiffPixelRatio: 0.01});
  });
});
