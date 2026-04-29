/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const path = require('path');
const fs = require('fs').promises;

if (process.argv.length < 3) {
  console.log("Usage: node load-sample.js <path_to_project_root>");
  return -1;
}

const output = path.join('..', 'Assets', 'Resources', 'SampleProject');

async function main() {
  const files = (await fs.readdir(process.argv[2])).filter(f => f.endsWith('.hasp'));

  if (files.length === 0) return;

  console.log('Deleting previous sample');
  for (const file of await fs.readdir(output)) {
    await fs.unlink(path.join(output, file));
  }

  const hasp = files[0];
  fs.copyFile(path.join(process.argv[2], hasp), path.join(output, 'project.json'));
  console.log('Creating project.hasp');

  const projectData = await fs.readFile(path.join(process.argv[2], hasp));
  const project = JSON.parse(projectData);
  const groups = project.groups;

  project.clips.forEach(clip => {
    if (groups.map(g => g.clips.includes(clip.clipId)).reduce((a, b) => a || b, false)) {
      fs.copyFile(path.join(process.argv[2], clip.audioAsset.filename), path.join(output, `${clip.clipId}.wav`));
      console.log(`Creating ${clip.clipId}.wav`);
      fs.copyFile(path.join(process.argv[2], `${clip.name}.haptic`), path.join(output, `${clip.clipId}.haptic`));
      console.log(`Creating ${clip.clipId}.haptic`);
    }
  });
}

main();
