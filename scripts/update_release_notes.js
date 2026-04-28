/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const fs = require('fs');
const path = require('path');
const YAML = require('yaml')
const { spawnSync } = require('child_process');

function updateReleaseNotes(filePath, releaseNotes, channel) {
  if (fs.existsSync(filePath)) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const ymlContent = YAML.parse(fileContent);

      // Update the release notes
      ymlContent.releaseNotes = releaseNotes;

      // Update the file path and the file urls
      ymlContent.files.forEach(file => {
        file.url = file.url.replace('universal.zip', `universal-${channel}.zip`);
        file.url = file.url.replace('universal.dmg', `universal-${channel}.dmg`);
        file.url = file.url.replace('x64.exe', `x64-${channel}.exe`);
      });
      ymlContent.path = ymlContent.path.replace('universal.zip', `universal-${channel}.zip`);
      ymlContent.path = ymlContent.path.replace('x64.exe', `x64-${channel}.exe`);

      fs.writeFileSync(filePath, YAML.stringify(ymlContent));
    } catch (error) {
      console.error(error);
    }
  }
}

function generateSHA512(filePath, assetName) {
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const ymlContent = YAML.parse(fileContent);
    // generate SHA 512
    try {
      const assetPath = path.join(distPath, assetName);
      const file = ymlContent.files.find(f => f.url === assetName)
      const res = spawnSync('openssl', ['dgst', '-sha512', '-binary', assetPath]);
      const res2 = spawnSync('openssl', ['base64'], { input: res.stdout, encoding: 'utf-8' });
      const sha512 = res2.stdout.replaceAll('\n', '');;
      file.sha512 = sha512;
      ymlContent.sha512 = sha512;
      fs.writeFileSync(filePath, YAML.stringify(ymlContent));
    } catch (error) {
      console.log(error);
    }
  }
}

const releaseNotesFilePath = process.env.RELEASE_NOTES_FILES || 'release-notes.md';
const distPath = process.env.DIST_PATH || path.join('dist');

if (!fs.existsSync(releaseNotesFilePath)) {
  return;
}

const releaseNotes = fs.readFileSync(releaseNotesFilePath, 'utf8');

const latestYmlPath = path.join(distPath, 'latest.yml');
const latestMacYmlPath = path.join(distPath, 'latest-mac.yml');


// Add channel name to the artifacts
const channel = process.env.CHANNEL || 'latest';
const macZip = path.join(distPath, 'haptic-studio-mac-universal.zip');
if (fs.existsSync(macZip)) {
  fs.renameSync(macZip, path.join(distPath, `haptic-studio-mac-universal-${channel}.zip`));
}
const macZipBlockmap = path.join(distPath, 'haptic-studio-mac-universal.zip.blockmap');
if (fs.existsSync(macZipBlockmap)) {
  fs.renameSync(macZipBlockmap, path.join(distPath, `haptic-studio-mac-universal-${channel}.zip.blockmap`));
}
const macDmg = path.join(distPath, 'haptic-studio-mac-universal.dmg');
if (fs.existsSync(macDmg)) {
  fs.renameSync(macDmg, path.join(distPath, `haptic-studio-mac-universal-${channel}.dmg`));
}
const macDmgBlockmap = path.join(distPath, 'haptic-studio-mac-universal.dmg.blockmap');
if (fs.existsSync(macDmgBlockmap)) {
  fs.renameSync(macDmgBlockmap, path.join(distPath, `haptic-studio-mac-universal-${channel}.dmg.blockmap`));
}
const winExe = path.join(distPath, 'haptic-studio-win-x64.exe');
if (fs.existsSync(winExe)) {
  fs.renameSync(winExe, path.join(distPath, `haptic-studio-win-x64-${channel}.exe`));
}
const winExeBlockmap = path.join(distPath, 'haptic-studio-win-x64.exe.blockmap');
if (fs.existsSync(winExeBlockmap)) {
  fs.renameSync(winExeBlockmap, path.join(distPath, `haptic-studio-win-x64-${channel}.exe.blockmap`));
}

updateReleaseNotes(latestYmlPath, releaseNotes, channel);
updateReleaseNotes(latestMacYmlPath, releaseNotes, channel);

// Recalculate SHA512 only for Win exe
const assetPath = `haptic-studio-win-x64-${channel}.exe`;
generateSHA512(latestYmlPath, assetPath);

// Rename the yml files
if (process.env.CHANNEL === 'beta') {
  if (fs.existsSync(latestYmlPath)) {
    fs.renameSync(latestYmlPath, path.join(distPath, 'beta.yml'));
  }
  if (fs.existsSync(latestMacYmlPath)) {
    fs.renameSync(latestMacYmlPath, path.join(distPath, 'beta-mac.yml'));
  }
}
