/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * ProtocolHandler - Registers and handles the media:// protocol
 *
 * Resolves media:// URLs to local file paths by checking:
 * 1. Absolute paths
 * 2. Project-relative paths
 * 3. Assets folder
 * 4. Samples folder (fallback)
 */

import path from 'path';
import fs from 'fs';
import {pathToFileURL} from 'url';
import {net, protocol} from 'electron';

import Logger from '../common/logger';
import Configs from '../common/configs';
import {isOnWindows} from '../common/utils';
import PathManager from './PathManager';

export default class ProtocolHandler {
  /**
   * Registers the media:// protocol handler.
   * Must be called after app.whenReady().
   */
  static register(): void {
    protocol.handle('media', request => {
      let filePath = request.url.replace(/(media:\/\/)/, '');

      // Decode URI components (including %3A back to :)
      try {
        filePath = decodeURIComponent(filePath);
      } catch {
        // If decoding fails, use the original path
      }

      // On Windows, normalize the path by converting forward slashes to backslashes
      // This is needed because we send URLs with forward slashes to avoid CSS escape issues
      if (isOnWindows()) {
        filePath = filePath.replace(/\//g, '\\');
      }

      const {tmpProjectFile} = Configs.instance.getCurrentProject();

      // First check if the resource is an absolute path
      if (path.isAbsolute(filePath)) {
        if (fs.existsSync(filePath)) {
          return net.fetch(pathToFileURL(filePath).href);
        } else {
          Logger.warn(`Absolute path does not exist: ${filePath}`);
          return new Response();
        }
      }

      // Check if the resource is inside the project folder
      if (tmpProjectFile) {
        const projectRelativePath = path.join(
          path.dirname(tmpProjectFile),
          filePath,
        );

        if (fs.existsSync(projectRelativePath)) {
          return net.fetch(pathToFileURL(projectRelativePath).href);
        }
      }

      // Try assets folder
      const assetsPath = path.join(
        PathManager.instance.getAssetsPath(),
        filePath,
      );
      if (fs.existsSync(assetsPath)) {
        return net.fetch(pathToFileURL(assetsPath).href);
      }

      // Try samples folder as last resort
      const samplesPath = path.join(
        PathManager.instance.getSamplesPath(),
        filePath,
      );
      if (fs.existsSync(samplesPath)) {
        return net.fetch(pathToFileURL(samplesPath).href);
      }

      Logger.warn(`Missing media at path: ${filePath}`);
      return new Response();
    });
  }
}
