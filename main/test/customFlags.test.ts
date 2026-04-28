/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import path from 'path';
import fs from 'fs';
import {getCustomFlags} from '../src/customFlags';

describe('Custom flags', () => {
  const mainPath = path.join(path.resolve(__dirname), '..');
  const filePath = path.join(mainPath, 'flags.json');

  describe('when the flags file is available', () => {
    beforeAll(() => {
      fs.writeFileSync(filePath, '{ "externalAudio": true }');
    });
    afterAll(() => {
      fs.rmSync(filePath);
    });

    it('should load the custom flags', () => {
      expect(getCustomFlags(mainPath).externalAudio).toBeTruthy();
    });
  });

  describe('when the flags file does not exist', () => {
    it('should return an empty object', () => {
      expect(getCustomFlags(mainPath).externalAudio).toBeUndefined();
    });
  });
});
