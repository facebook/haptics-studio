/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const fs = require('fs');
const path = require('path');

function getDirectories(sourcePath) {
  return fs.readdirSync(sourcePath)
    .map(name => path.join(sourcePath, name))
    .filter((el) => fs.statSync(el).isDirectory());
}

const metadataFileName = process.env.SAMPLES_METADATA_FILENAME || 'metadata.json';
const samplesPath = process.env.SAMPLES_PATH || path.join(__dirname, '..', 'main', 'samples');
const metadataFilePath = path.join(samplesPath, metadataFileName);

if (!fs.existsSync(samplesPath)) {
  console.error(`${samplesPath} does not exist.`);
  return;
}

const supportedExtensions = ['.hasp'];
let samples = [];
const categories = getDirectories(samplesPath);
for (let index = 0; index < categories.length; index += 1) {
  const categoryPath = categories[index];
  const projectFiles = fs.readdirSync(categoryPath).filter((file) => supportedExtensions.includes(path.extname(file).toLowerCase()));
  for (let idx = 0; idx < projectFiles.length; idx += 1) {
    const projectFile = path.join(categoryPath, projectFiles[idx]);
    const baseName = path.basename(projectFiles[idx].replace(path.extname(projectFiles[idx]), ''));
    let iconPath = path.join(categoryPath, `${baseName}.svg`);
    if (!fs.existsSync(iconPath)) {
      iconPath = path.join(categoryPath, `${baseName}.png`);
    }
    if (fs.existsSync(projectFile)) {
      const file = fs.readFileSync(projectFile, 'utf8');
      const content = JSON.parse(file);
      const { name = baseName, category = '', description = '', slug = '', version = '' } = content.metadata || {};
      samples.push({
        name: name.replace(/_/g, ' '),
        projectFile: path.relative(samplesPath, projectFile),
        icon: path.relative(samplesPath, iconPath),
        clipsCount: content.clips ? Object.keys(content.clips).length : 0,
        category,
        description,
        slug,
        version,
        updatedAt: content.updatedAt ?? new Date().getTime(),
      });
    }
  }
}

const priorities = JSON.parse(fs.readFileSync(path.join(samplesPath, 'priority.json'), 'utf8'));
const maxPriority = Math.max(...Object.values(priorities).map(v => v.priority));

samples = samples.sort((a, b) => a.name > b.name ? 1 : -1);
for (let idx = 0; idx < samples.length; idx += 1) {
  samples[idx].order = priorities[samples[idx].name]?.priority ?? maxPriority + (idx + 1);
  samples[idx].new = priorities[samples[idx].name]?.new ?? false;
}

fs.writeFileSync(metadataFilePath, JSON.stringify(samples, null, 2));
