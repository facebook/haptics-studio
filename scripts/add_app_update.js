/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const packageJson = JSON.parse(fs.readFileSync('./package.json'));

// Example Content to write
// provider: generic
// url: https://www.example.com/
// channel: latest
// updaterCacheDirName: haptic-studio-updater
function writeAppUpdateFile(folder) {
  try {
    if (fs.existsSync(folder)) {
      const filePath = path.join(folder, appUpdateFileName);
      const contentToWrite = {
        ...(packageJson.build.publish || {}),
        updaterCacheDirName: `${packageJson.name}-updater`,
      };
      fs.writeFileSync(filePath, YAML.stringify(contentToWrite));
    }
  } catch (error) {
    console.error(error);
  }
}

const distPath = process.env.DIST_PATH || path.join('dist');
const macUniversal = 'mac-universal';
const appName = `${packageJson.build.productName}.app`;
const winUnpacked = 'win-unpacked';
const appUpdateFileName = 'app-update.yml';

const macFolder = path.join(
  distPath,
  macUniversal,
  appName,
  'Contents',
  'Resources',
);
const winFolder = path.join(distPath, winUnpacked, 'resources');

writeAppUpdateFile(macFolder);
writeAppUpdateFile(winFolder);
