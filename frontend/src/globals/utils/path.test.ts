/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {basename, extname} from './path';

const SUPPORTED_AUDIO_EXTENSIONS = [
  '.mp3',
  '.ogg',
  '.pcm',
  '.vorbis',
  '.wav',
  '.aiff',
  '.aif',
];

describe('path utilities', () => {
  it.each(SUPPORTED_AUDIO_EXTENSIONS)(
    'matches basename behavior for %s files',
    extension => {
      const filePath = `C:\\audio/folder/clip${extension}`;
      expect(basename(filePath)).toBe(`clip${extension}`);
      expect(extname(filePath)).toBe(extension);
      expect(basename(filePath, extname(filePath))).toBe('clip');
    },
  );

  it('preserves leading dots and ignores trailing separators', () => {
    expect(extname('/audio/.hidden')).toBe('');
    expect(basename('/audio/folder/')).toBe('folder');
  });
});
