/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Platform-specific utility functions
 */
import os from 'os';
import path from 'path';
import {PathManager} from '../../services';

export enum IPlatform {
  WIN = 'win32',
  MAC = 'darwin',
}

/**
 * Check if the current platform is Windows
 * @returns true if running on Windows
 */
export function isOnWindows(): boolean {
  return process.platform === 'win32';
}

/**
 * Get the current platform
 * @returns The current platform as IPlatform enum
 */
export function getCurrentPlatform(): IPlatform {
  return os.platform() as IPlatform;
}

/**
 * Escape a file path for shell command execution
 * @param filePath - The file path to escape
 * @returns The escaped file path
 */
export function escapeFilePath(filePath: string): string {
  const isPosixOS = os.platform() !== 'win32';
  const version = os.release();

  const windowsVersionRegex = /(\d+\.\d+)\.(\d+)/;
  const shouldNotEscape = (major_release = '', os_build = '') => {
    return /1\d+\.\d+/.test(major_release) && Number(os_build) >= 17134.1184;
  };

  let winReplace = shouldNotEscape(
    ...(windowsVersionRegex.exec(version)?.splice(1) || ['', '']),
  )
    ? // on major version, no need to escape anymore
      // https://support.microsoft.com/en-us/help/4467268/url-encoded-unc-paths-not-url-decoded-in-windows-10-version-1803-later
      filePath
    : // on older version, replace space with symbol %20
      filePath.replace(/(\s+)/g, '%20');

  if (!isPosixOS) {
    const rootName = path.parse(winReplace).root;
    winReplace = `${rootName}"${winReplace.replace(rootName, '')}"`;
  }

  return isPosixOS ? filePath.replace(/(\s+)/g, '\\$1') : winReplace;
}

/**
 * Get the path to the ADB executable
 * @returns The path to the ADB executable
 */
export function getAdbPath(): string {
  const isWindows = os.platform() === 'win32';
  const adbCommand = isWindows ? 'adb.exe' : `adb.${os.platform()}`;
  return path.join(`${PathManager.instance.getBinPath()}`, adbCommand);
}
