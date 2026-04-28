/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Project-related utility functions
 */
import fs from 'fs';
import path from 'path';
import {isEmpty, max} from 'lodash';
import Configs from '../configs';
import Constants from '../constants';
import {PathManager} from '../../services';
import Project from '../project';

/**
 * Characters that are invalid in filenames on Windows and/or macOS
 */
const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1f]/g;

/**
 * Windows reserved filenames (case-insensitive)
 */
const WINDOWS_RESERVED_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

/**
 * Sanitizes a filename/folder name for cross-platform compatibility (Windows & macOS).
 * - Removes invalid characters: < > : " / \ | ? * and control characters
 * - Trims leading/trailing spaces and periods (Windows requirement)
 * - Handles Windows reserved names by appending an underscore
 * @param name The filename or folder name to sanitize
 * @param replacement Character to replace invalid chars with (default: '')
 * @returns The sanitized name
 */
export function sanitizeFilename(name: string, replacement = ''): string {
  let sanitized = name
    .replace(INVALID_FILENAME_CHARS, replacement)
    .replace(/^[\s.]+|[\s.]+$/g, ''); // Trim leading/trailing spaces and periods

  // Handle Windows reserved names
  if (WINDOWS_RESERVED_NAMES.test(sanitized)) {
    sanitized = `${sanitized}_`;
  }

  // If the name becomes empty after sanitization, provide a fallback
  if (sanitized.length === 0) {
    sanitized = 'unnamed';
  }

  return sanitized;
}

/**
 * Get project to open based on file path
 * @param filePath - The file path to check
 * @returns Object with projectToOpen path and isDirty flag
 */
export function getProjectToOpen(filePath: string): {
  projectToOpen: string;
  isDirty: boolean;
} {
  // if the project to open is the current project
  // load the current project with its last state
  const {
    tmpProjectFile,
    projectFile,
    dirty = false,
  } = Configs.instance.getCurrentProject();
  const currentProjectFile = Configs.instance.getCurrentProjectFile();
  let isDirty = false;
  let projectToOpen;
  if (
    isEmpty(filePath) ||
    filePath === projectFile ||
    filePath === tmpProjectFile
  ) {
    isDirty = dirty;
    projectToOpen = currentProjectFile ?? '';
  } else {
    projectToOpen = filePath;
  }
  return {projectToOpen, isDirty};
}

/**
 * Get all directories in a source path
 * @param sourcePath - The source path to scan
 * @returns Array of directory paths
 */
export function getDirectories(sourcePath: string): string[] {
  return fs
    .readdirSync(sourcePath)
    .map(name => path.join(sourcePath, name))
    .filter(el => fs.statSync(el).isDirectory());
}

/**
 * Get all audio files in a source path (recursive)
 * @param sourcePath - The source path to scan
 * @returns Array of audio file paths
 */
export function getAudioFiles(sourcePath: string): string[] {
  const audioExtensions = Constants.PROJECT.SUPPORTED_AUDIO_EXTENSIONS;
  const contents = fs.readdirSync(sourcePath);
  const files: string[] = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const name of contents) {
    const currentPath = path.join(sourcePath, name);
    const isDirectory = fs.lstatSync(currentPath).isDirectory();
    if (isDirectory) {
      files.push(...getAudioFiles(currentPath));
    }
    files.push(currentPath);
  }
  return files.filter(el => audioExtensions.includes(path.extname(el)));
}

/**
 * Check if a project file is a sample project
 * @param projectFile - The project file path
 * @returns true if the project is a sample
 */
export function isSampleProject(projectFile: string): boolean {
  const samplesPath = PathManager.instance.getSamplesPath();
  return projectFile.startsWith(samplesPath) || Project.instance.isTutorial();
}

/**
 * Check if a project file is a built-in tutorial
 * @param projectFile - The project file path
 * @returns true if the project is a built-in tutorial
 */
export function isBuiltInTutorial(projectFile: string): boolean {
  return (
    projectFile.includes(Constants.PROJECT.TUTORIAL_PREFIX) &&
    isSampleProject(projectFile)
  );
}

/**
 * Check if a project file is a custom tutorial
 * @param projectFile - The project file path
 * @returns true if the project is a custom tutorial
 */
export function isCustomTutorial(projectFile: string): boolean {
  return (
    projectFile.includes(Constants.PROJECT.TUTORIAL_PREFIX) &&
    !isSampleProject(projectFile)
  );
}

/**
 * Check if a project name is untitled
 * @param projectName - The project name to check
 * @returns true if the project is untitled
 */
export function isUntitledProject(projectName: string): boolean {
  if (projectName === Constants.DEFAULT_PROJECT_NAME) {
    return true;
  }
  const regexp = new RegExp(`${Constants.DEFAULT_PROJECT_NAME}-(\\d+)`);
  const res = projectName.match(regexp);
  return !isEmpty(res);
}

/**
 * Count the number of untitled projects in a directory
 * @param dirPath - The directory path to scan
 * @returns The count of untitled projects
 */
export function countUntitledProjects(dirPath: string): number {
  const projectFileExt = Configs.configs.app.projectFile.extension;
  const numbers: number[] = fs.readdirSync(dirPath).map(f => {
    const regexp = new RegExp(
      `${Constants.DEFAULT_PROJECT_NAME}-(\\d+)${projectFileExt}`,
    );
    const res = f.match(regexp);
    const number = res ? res[1] : '0';
    return parseInt(number, 10);
  }) || [0];
  return max(numbers) || 0;
}
