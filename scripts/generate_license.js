/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const fs = require('fs');
const showdown = require('showdown');

const template = fs.readFileSync('main/assets/licenses_template.html', {
  encoding: 'utf-8',
});
const markdown = fs.readFileSync('licenses.md', {encoding: 'utf-8'});

const converter = new showdown.Converter();
converter.setOption('simpleLineBreaks', true);
let html = converter.makeHtml(markdown);

html = html.replace(
  'please bring it to our attention through any of the ways detailed here :',
  'please bring it to our attention through any of the ways detailed here:<p><a href="https://github.com/facebook/haptics-studio/issues">https://github.com/facebook/haptics-studio/issues</a></p>',
);

const file = template
  .replace('[content]', html)
  .replace('haptic-studio', 'Haptics Studio');

fs.writeFileSync('main/assets/licenses.html', file);
