/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Asset Path Utilities - Functions for managing asset paths in projects
 *
 * Handles conversion between absolute and relative paths for project assets.
 */

import fs from 'fs';
import path from 'path';
import {isNil} from 'lodash';
import {PathManager} from '../../services';
import {isSampleProject} from '../utils';
import {Clip, ProjectContent} from './types';

/**
 * Get the default path for saving a project
 * If the current clip audio path is absolute, use its folder
 * If relative, use the project file's folder
 */
export const getDefaultProjectPath = (
  projectFile: string,
  currentClip: Clip | undefined,
): string => {
  let assetPath: string = path.dirname(projectFile);

  // If the audio path is absolute (not saved yet), use the audio file's folder
  if (
    currentClip &&
    currentClip.audioAsset &&
    currentClip.audioAsset.path &&
    path.isAbsolute(currentClip.audioAsset.path)
  ) {
    assetPath = path.dirname(currentClip.audioAsset.path);
  }

  // Use home path instead of samples folder
  if (assetPath.startsWith(PathManager.instance.getSamplesPath())) {
    return PathManager.instance.getHomePath();
  }

  return assetPath;
};

/**
 * Update the assets paths of each clip to be absolute.
 * If a path is relative, it will be composed with the project file path.
 */
export const setAbsoluteAssetsPaths = (
  content: ProjectContent,
  projectFilePath: string,
): void => {
  if (isNil(content)) return;

  const {clips} = content;
  for (let index = 0; index < clips.length; index += 1) {
    const clip = clips[index];
    const {audioAsset} = clip;

    // If the audio file path is relative, compose it with the project dir
    if (audioAsset && audioAsset.path && !path.isAbsolute(audioAsset.path)) {
      const audioFilePath = path.join(
        path.dirname(projectFilePath),
        audioAsset.path,
      );
      audioAsset.path = audioFilePath;
    }
  }
};

/**
 * Check if two paths are on different drives
 */
const areOnDifferentDrives = (path1: string, path2: string): boolean => {
  // By default, assume different drives (use absolute path)
  if (!fs.existsSync(path1) || !fs.existsSync(path2)) {
    return true;
  }
  try {
    return fs.statSync(path1).dev !== fs.statSync(path2).dev;
  } catch {
    // Permission errors or other issues - assume different drives for safety
    return true;
  }
};

/**
 * Convert asset path to relative or keep absolute based on context
 */
const convertAssetPath = (
  assetPath: string,
  projectFile: string,
  previousProjectFile: string,
  isSample: boolean,
): string => {
  // Get absolute path first
  const absolutePath = path.isAbsolute(assetPath)
    ? assetPath
    : path.resolve(path.dirname(previousProjectFile), assetPath);

  // Check if on different drives
  const onDifferentDrives = areOnDifferentDrives(absolutePath, projectFile);

  // Use absolute path if on different drives or if it's a sample project
  if (onDifferentDrives || isSample) {
    return absolutePath;
  }

  // Otherwise, use relative path
  return path.relative(path.dirname(projectFile), absolutePath);
};

/**
 * Sets the clip audio file paths relative to the project file path.
 * Returns true if any paths were modified.
 */
export const setRelativeAssetsPath = (
  content: Partial<ProjectContent>,
  projectFile: string,
  previousProjectFile: string,
): boolean => {
  const isSample = isSampleProject(projectFile);
  if (!content.clips) return false;

  let modified = false;
  const {clips = [] as Clip[]} = content;

  for (let index = 0; index < clips.length; index += 1) {
    const clip = clips[index];

    // Handle audio asset
    if (clip.audioAsset && clip.audioAsset.path) {
      const assetPath = convertAssetPath(
        clip.audioAsset.path,
        projectFile,
        previousProjectFile,
        isSample,
      );
      clip.audioAsset.path = assetPath;

      // Update the source path in haptic metadata
      if (clip.haptic?.metadata) {
        clip.haptic.metadata.source = assetPath;
      }
      modified = true;
    }
  }

  return modified;
};
