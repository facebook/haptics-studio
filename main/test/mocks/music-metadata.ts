/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {execFile} from 'child_process';
import {promisify} from 'util';

import type {
  IAudioMetadata,
  IOptions,
  parseFile as ParseFile,
} from 'music-metadata';

const execFileAsync = promisify(execFile);
const parseFileScript = `
const [filePath, options] = process.argv.slice(1);
require('music-metadata')
  .parseFile(filePath, JSON.parse(options))
  .then(metadata => process.stdout.write(JSON.stringify(metadata)));
`;

async function parseFileWithNode(
  filePath: string,
  options?: IOptions,
): Promise<IAudioMetadata> {
  const {stdout} = await execFileAsync(process.execPath, [
    '-e',
    parseFileScript,
    filePath,
    JSON.stringify(options ?? {}),
  ]);
  return JSON.parse(stdout) as IAudioMetadata;
}

export const parseFile = jest.fn<
  ReturnType<typeof ParseFile>,
  Parameters<typeof ParseFile>
>(parseFileWithNode);

beforeEach(() => {
  parseFile.mockImplementation(parseFileWithNode);
});
