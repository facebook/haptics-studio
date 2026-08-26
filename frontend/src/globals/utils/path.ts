/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export function basename(filePath: string, extension?: string): string {
  const name = filePath.replace(/[\\/]+$/, '').split(/[\\/]/).pop() ?? '';
  return extension && name.endsWith(extension)
    ? name.slice(0, -extension.length)
    : name;
}

export function extname(filePath: string): string {
  const name = basename(filePath);
  const extensionIndex = name.lastIndexOf('.');
  if (extensionIndex <= 0) {
    return '';
  }
  return name.slice(extensionIndex);
}
