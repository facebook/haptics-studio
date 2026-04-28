/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-param-reassign */

import path from 'path';
import {readFile} from 'fs/promises';
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
import {delay, dropTestFile, acceptTerms} from './utils';

const latestBuild = findLatestBuild('dist');
const appInfo = parseElectronApp(latestBuild);
let electronApp: ElectronApplication;
let page: Page;
let userDataPath: string;

async function renameAndSaveProject(
  app: ElectronApplication,
  page: Page,
  dataPath: string,
  close: boolean,
) {
  await app.evaluate(
    ({dialog}, {path}) => {
      dialog.showSaveDialogSync = () => path;
    },
    {
      path: path.join(dataPath, 'my-project.hasp'),
    },
  );

  await page.getByText('My Project').dblclick();
  await page.getByRole('textbox').fill('my-project');
  await page.keyboard.down('Enter');
  await delay(500);

  if (close) {
    await app.evaluate(async params => {
      const fileMenu = params.app.applicationMenu?.getMenuItemById('file');
      const closeItem = fileMenu?.submenu?.getMenuItemById('close');
      await closeItem?.click();
    });
  }
}

async function createMarker(
  app: ElectronApplication,
  page: Page,
  offset: {x: number; y: number},
) {
  const editorBounds = await page.getByTestId('editor').boundingBox();
  if (editorBounds) {
    await page.keyboard.down('m');
    await page.mouse.click(
      editorBounds.x + editorBounds.width / 2 + offset.x,
      editorBounds.y + offset.y,
    );
    await delay(200);
    await page.keyboard.down('Enter');
  } else {
    expect(false, 'Unable to find the editor bounding box').toEqual(true);
  }
}

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

test.describe('general smoke test', () => {
  test('app should save the terms and conditions acceptance', async () => {
    await acceptTerms(page);

    await delay(1000);
    await electronApp.close();
    await delay(1000);
    electronApp = await electron.launch({
      args: [appInfo.main, '--force-device-scale-factor=2'],
      executablePath: appInfo.executable,
    });
    page = await electronApp.firstWindow();
    await delay(1000);

    expect(await page.getByText(/new project/i).count()).toBe(1);
  });

  test('dragging an audio file creates a new project', async () => {
    await acceptTerms(page);

    await dropTestFile(page, 'landing-content');

    await expect(page).toHaveScreenshot({maxDiffPixelRatio: 0.01});
  });

  test('selecting an audio file from the open dialog creates a new project', async () => {
    await acceptTerms(page);

    await page.getByText('New Project').click();
    await page.waitForSelector('[data-testid="create-audio"]');

    await electronApp.evaluate(
      ({dialog}, {path}) => {
        dialog.showOpenDialogSync = () => [path];
      },
      {
        path: path.join(__dirname, 'test.wav'),
      },
    );

    await page.getByTestId('create-audio').click();

    await expect(page).toHaveScreenshot({maxDiffPixelRatio: 0.01});
  });

  test('double click on a clip should allow rename', async () => {
    await acceptTerms(page);
    await dropTestFile(page, 'landing-content');

    await page.getByTestId('clip').dblclick();
    await page.getByRole('textbox').fill('clip 1');
    await page.keyboard.down('Enter');

    expect(
      await page.getByTestId('clip').getByText('clip 1', {exact: true}).count(),
    ).toBe(1);
  });

  test('dragging an audio in an existing project adds a new clip', async () => {
    await acceptTerms(page);
    await dropTestFile(page, 'landing-content');

    await dropTestFile(page, 'navigator');

    expect(await page.getByTestId('clip').count()).toBe(2);
  });

  test('grouping clips and group renaming', async () => {
    await acceptTerms(page);
    await dropTestFile(page, 'landing-content');

    await page.getByTestId('clip').first().dblclick();
    await page.getByRole('textbox').fill('clip 1');
    await page.keyboard.down('Enter');

    await dropTestFile(page, 'navigator');

    await page.getByTestId('clip').last().dblclick();
    await page.getByRole('textbox').fill('clip 2');
    await page.keyboard.down('Enter');

    await page.getByTestId('clip').getByText('clip 1').click();
    await page
      .getByTestId('clip')
      .getByText('clip 2')
      .click({modifiers: ['Shift']});
    await electronApp.evaluate(async ({app}) => {
      const editMenu = app.applicationMenu?.getMenuItemById('edit');
      const group = editMenu?.submenu?.getMenuItemById('group');
      await group?.click();
    });
    await page.getByTestId('navigator').getByText('untitled').dblclick();
    await page.getByRole('textbox').fill('group 1');
    await page.keyboard.down('Enter');

    expect(await page.getByText('group 1').count()).toBe(1);
  });

  test('project rename', async () => {
    await acceptTerms(page);
    await dropTestFile(page, 'landing-content');

    await renameAndSaveProject(electronApp, page, userDataPath, false);

    expect(await page.getByText('my-project').count()).toBe(1);
  });

  test('recent projects are shown', async () => {
    await acceptTerms(page);
    await dropTestFile(page, 'landing-content');

    await renameAndSaveProject(electronApp, page, userDataPath, true);

    expect(await page.getByText('group 1').count()).toBe(0);
    expect(await page.getByText('my-project').count()).toBe(1);
  });

  test('open a recent project', async () => {
    await acceptTerms(page);
    await dropTestFile(page, 'landing-content');
    await dropTestFile(page, 'navigator');

    await renameAndSaveProject(electronApp, page, userDataPath, true);
    await delay(100);
    expect(await page.getByText('2 clips').count()).toBe(1);

    await page.getByText('my-project').click();
    await delay(100);
    expect(await page.getByTestId('clip').count()).toBe(2);
  });

  test('edit amplitude', async () => {
    await acceptTerms(page);
    await dropTestFile(page, 'landing-content');

    const editorBounds = await page.getByTestId('editor').boundingBox();
    if (editorBounds) {
      // Create a selection rectangle
      await page.mouse.move(
        editorBounds.x + 100,
        editorBounds.y + editorBounds.height / 2,
      );
      await page.mouse.down();
      await page.mouse.move(
        editorBounds.x + 250,
        editorBounds.y + editorBounds.height / 2 - 100,
      );
      await page.mouse.move(
        editorBounds.x + 251,
        editorBounds.y + editorBounds.height / 2 - 100,
      );
      await page.mouse.up();

      // Scale it
      await page.mouse.move(
        editorBounds.x + 160,
        editorBounds.y + editorBounds.height / 2 + 2,
      );
      await page.mouse.down();
      await page.mouse.move(
        editorBounds.x + 160,
        editorBounds.y + editorBounds.height / 2 + 50,
      );
      await page.mouse.up();

      await page.mouse.click(
        editorBounds.x + editorBounds.width / 2,
        editorBounds.y + editorBounds.height / 2,
      );

      await expect(page).toHaveScreenshot({maxDiffPixelRatio: 0.01});
    } else {
      expect(false, 'Unable to find the editor bounding box').toEqual(true);
    }
  });

  test('create emphasis point', async () => {
    await acceptTerms(page);
    await dropTestFile(page, 'landing-content');

    const editorBounds = await page.getByTestId('editor').boundingBox();
    if (editorBounds) {
      // Create a selection rectangle
      await page.mouse.move(
        editorBounds.x + 50,
        editorBounds.y + editorBounds.height / 2,
      );
      await page.mouse.down();
      await page.mouse.move(
        editorBounds.x + 80,
        editorBounds.y + editorBounds.height / 2 - 100,
      );
      await page.mouse.move(
        editorBounds.x + 81,
        editorBounds.y + editorBounds.height / 2 - 100,
      );
      await page.mouse.up();
      await delay(500);

      await electronApp.evaluate(async ({app}) => {
        const editMenu = app.applicationMenu?.getMenuItemById('edit');
        const emphasisItem = editMenu?.submenu?.getMenuItemById('emphasis');
        await emphasisItem?.click();
      });

      await expect(page).toHaveScreenshot({maxDiffPixelRatio: 0.01});
    } else {
      expect(false, 'Unable to find the editor bounding box').toEqual(true);
    }
  });

  test('create a marker', async () => {
    await acceptTerms(page);
    await dropTestFile(page, 'landing-content');

    await createMarker(electronApp, page, {x: 0, y: 10});
    await expect(page).toHaveScreenshot({maxDiffPixelRatio: 0.01});
  });

  test('rename and delete marker', async () => {
    await acceptTerms(page);
    await dropTestFile(page, 'landing-content');

    await createMarker(electronApp, page, {x: 0, y: 10});

    await page.getByText('Marker 1').dblclick();
    await page.getByRole('textbox').fill('Marker name');
    await page.keyboard.down('Enter');
    await expect(page.getByText('Marker name')).toBeVisible();
    await delay(200);
    await page.getByTestId('delete-marker').click();
  });

  test('create a second marker', async () => {
    await acceptTerms(page);
    await dropTestFile(page, 'landing-content');

    await createMarker(electronApp, page, {x: -50, y: 10});
    await expect(page.getByText('Marker 1')).toBeVisible();

    await createMarker(electronApp, page, {x: 50, y: 10});
    await expect(page.getByText('Marker 2')).toBeVisible();
  });

  test('export a clip', async () => {
    await acceptTerms(page);
    await dropTestFile(page, 'landing-content');

    await electronApp.evaluate(async ({app}) => {
      const fileMenu = app.applicationMenu?.getMenuItemById('file');
      const exportItem = fileMenu?.submenu?.getMenuItemById('export');
      await exportItem?.click();
    });

    await electronApp.evaluate(
      ({dialog}, {path}) => {
        dialog.showOpenDialogSync = () => [path];
      },
      {
        path: path.join(userDataPath),
      },
    );

    await page
      .locator('div')
      .getByRole('button', {name: 'Export 1 Clip'})
      .click();
    const hapticFile = await readFile(path.join(userDataPath, 'test.haptic'));
    expect(hapticFile.length).toBeGreaterThan(0);
  });

  test('save as', async () => {
    await acceptTerms(page);
    await dropTestFile(page, 'landing-content');

    await renameAndSaveProject(electronApp, page, userDataPath, false);

    expect(await page.getByText('my-project').count()).toBe(1);

    await electronApp.evaluate(
      ({dialog}, {path}) => {
        dialog.showSaveDialogSync = () => path;
      },
      {
        path: path.join(userDataPath, 'renamed.hasp'),
      },
    );

    await delay(500);

    await electronApp.evaluate(async ({app}) => {
      const editMenu = app.applicationMenu?.getMenuItemById('file');
      const emphasisItem = editMenu?.submenu?.getMenuItemById('save_as');
      await emphasisItem?.click();
    });

    await delay(500);

    await expect(page.getByText('renamed')).toBeVisible();
    await expect(page.getByTestId('clip')).toBeVisible();
  });
});
