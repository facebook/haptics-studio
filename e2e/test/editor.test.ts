/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-param-reassign */

import path from 'path';
import { test, _electron as electron, ElectronApplication, Page, expect } from '@playwright/test';
import { findLatestBuild, parseElectronApp } from 'electron-playwright-helpers';
import rimraf from 'rimraf';
import { promisify } from 'util';
import { build } from '../../package.json';
import { acceptTerms, delay, dropTestFile } from './utils';

const latestBuild = findLatestBuild('dist');
const appInfo = parseElectronApp(latestBuild);
let electronApp: ElectronApplication;
let page: Page;
let userDataPath: string;

test.beforeEach(async () => {
  electronApp = await electron.launch({ args: [appInfo.main, '--force-device-scale-factor=2'], executablePath: appInfo.executable });
  page = await electronApp.firstWindow();

  const { productName } = build;

  // Clear the temp dir
  const appPath = await electronApp.evaluate(({ app }) => {
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

test.describe('editor test', () => {
  test('copy and paste should confirm with Enter', async () => {
    await acceptTerms(page);
    await dropTestFile(page, 'landing-content');

    const editorBounds = await page.getByTestId('editor').boundingBox();
    if (editorBounds) {
      // Create a selection rectangle
      await page.mouse.move(editorBounds.x + 50, editorBounds.y + editorBounds.height / 2);
      await page.mouse.down();
      await page.mouse.move(editorBounds.x + 200, editorBounds.y + editorBounds.height / 2 - 100);
      await page.mouse.move(editorBounds.x + 201, editorBounds.y + editorBounds.height / 2 - 100);
      await page.mouse.up();

      await electronApp.evaluate(async ({ app }) => {
        const fileMenu = app.applicationMenu?.getMenuItemById('edit');
        const copyItem = fileMenu?.submenu?.getMenuItemById('copy');
        await copyItem?.click();
      });

      await delay(100);

      await electronApp.evaluate(async ({ app }) => {
        const fileMenu = app.applicationMenu?.getMenuItemById('edit');
        const pasteItem = fileMenu?.submenu?.getMenuItemById('paste');
        await pasteItem?.click();
      });

      await delay(100);

      await page.mouse.move(editorBounds.x + editorBounds.width / 2, editorBounds.y + editorBounds.height / 2);
      await page.mouse.down();
      await page.mouse.move(editorBounds.x + editorBounds.width / 2 - 100, editorBounds.y + editorBounds.height / 2);
      await page.mouse.up();

      await page.keyboard.press('Enter');

      await expect(page).toHaveScreenshot({ maxDiffPixelRatio: 0.01 });
    }
  });

  test('select all on the plot area should select all points', async () => {
    await acceptTerms(page);
    await dropTestFile(page, 'landing-content');

    const editorBounds = await page.getByTestId('editor').boundingBox();
    if (editorBounds) {
      // Select the plot
      await page.mouse.click(editorBounds.x + editorBounds.width / 2, editorBounds.y + editorBounds.height / 2);

      await electronApp.evaluate(async ({ app }) => {
        const fileMenu = app.applicationMenu?.getMenuItemById('edit');
        const selectAllItem = fileMenu?.submenu?.getMenuItemById('select_all');
        await selectAllItem?.click();
      });

      await expect(page).toHaveScreenshot({ maxDiffPixelRatio: 0.01 });
    }
  });

  test('select all on the navigator area should select all clips', async () => {
    await acceptTerms(page);
    await dropTestFile(page, 'landing-content');
    await dropTestFile(page, 'navigator');

    const editorBounds = await page.getByTestId('editor').boundingBox();
    if (editorBounds) {
      // Select the navigator
      await page.mouse.click(100, editorBounds.y + editorBounds.height / 2);

      await electronApp.evaluate(async ({ app }) => {
        const fileMenu = app.applicationMenu?.getMenuItemById('edit');
        const selectAllItem = fileMenu?.submenu?.getMenuItemById('select_all');
        await selectAllItem?.click();
      });

      await expect(page).toHaveScreenshot({ maxDiffPixelRatio: 0.01 });
    }
  });

  test('load and split stereo files', async () => {
    await acceptTerms(page);
    await dropTestFile(page, 'landing-content', 'stereo.wav');

    const editorBounds = await page.getByTestId('editor').boundingBox();
    if (editorBounds) {
      await page.getByText('stereo', { exact: true }).click({ button: 'right' });

      const contextMenuItem = page.getByText('Split');
      await expect(contextMenuItem).toBeVisible();
      await contextMenuItem.click();

      await expect(page.getByText('stereo_L')).toBeVisible();
      await expect(page.getByText('stereo_R')).toBeVisible();
    }
  });
});
