/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Returns the full media:// URL to access an asset served by the main process.
 * This also encodes backslashes and colons on Windows, as they are not allowed in URLs.
 * On Windows, paths like C:\path need to be converted to C%3A/path for proper URL handling
 * @param path The file path to encode
 * @param isOnWindows Whether the app is running on Windows
 * @returns The encoded path suitable for use as media:// URL
 */
export const mediaPath = (path: string, isOnWindows: boolean): string => {
  if (!isOnWindows) {
    return `media://${path}`;
  }

  // Convert backslashes to forward slashes and encode the colon after drive letter
  return `media://${path.replace(/\\/g, '/').replace(/^([A-Za-z]):/, '$1%3A')}`;
};
