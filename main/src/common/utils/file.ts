/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * File I/O utility functions
 */
import fs from 'fs';
import JSON5 from 'json5';
import vm from 'vm';

/**
 * Load and parse a JSON file
 * @param filename - Path to the JSON file
 * @returns Parsed JSON content
 */
export function loadJSONFile<T = Record<string, unknown>>(filename: string): T {
  try {
    const file = fs.readFileSync(filename, 'utf8');
    return JSON5.parse<T>(file);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error loading file ${filename}`);
    // eslint-disable-next-line no-console
    console.error(error);
    return {} as T;
  }
}

/**
 * Load a config file that exports module.exports
 * @param filename - Path to the config file
 * @returns Parsed config object
 */
export function loadConfigFile(filename: string): Record<string, unknown> {
  const file = fs.readFileSync(filename).toString();
  const sandbox = {process, module: {exports: {}}};
  vm.runInNewContext(file, sandbox);
  return sandbox.module.exports;
}

/**
 * Save content to a JSON file
 * @param filename - Path to save the file
 * @param content - Content to save
 */
export function saveJSONFile(
  filename: string,
  content: Record<string, unknown>,
): void {
  try {
    const jsonContent = JSON.stringify(content);
    fs.writeFileSync(filename, jsonContent);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
}

/**
 * Delete a file if it exists
 * @param filePath - Path to the file to delete
 */
export function deleteFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

/**
 * Check if a directory is empty
 * @param dirPath - Path to the directory
 * @returns true if the directory is empty
 */
export function isDirEmpty(dirPath: string | undefined): boolean {
  return (
    dirPath !== undefined &&
    dirPath !== null &&
    fs.existsSync(dirPath) &&
    fs.readdirSync(dirPath).length === 0
  );
}
