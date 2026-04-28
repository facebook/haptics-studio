/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-await-in-loop */
import {isEmpty, isEqual, isNil, omit} from 'lodash';
import {promisify} from 'util';
import fs from 'fs';
import path from 'path';
import {dialog} from 'electron';
import {HapticData, VisualWaveform} from '../hapticsSdk';

import Configs from '../common/configs';
import Project, {
  AssetFile,
  ClipGroup,
  ClipMarker,
  OathSettings,
} from '../common/project';
import {IPCMessage} from '../listeners';
import MainApplication from '../application';
import {PathManager} from '../services';
import Logger from '../common/logger';
import {
  countUntitledProjects,
  isBuiltInTutorial,
  isSampleProject,
  isCustomTutorial,
  isUntitledProject,
  saveJSONFile,
} from '../common/utils';
import Constants from '../common/constants';
import WSServer from '../wsServer';
// @oss-disable

export interface LoadPayload {
  sessionId: string;
  clipId: string;
  audio: {path: string; name: string} | undefined;
  svg: VisualWaveform;
  haptic: HapticData;
  audioFilePath: string;
  name?: string;
}

export interface OpenPayload {
  sessionId?: string;
  clips: ClipPayload[];
  groups: ClipGroup[];
  name: string;
  lastOpenedClipId?: string;
  projectExists: boolean;
  isSample: boolean;
  isTutorial: boolean;
  isAuthoringTutorial: boolean;
  description?: string;
  category?: string;
  slug?: string;
  version?: string;
}

export interface ClipPayload {
  name: string;
  audio?: AssetFile & {exists: boolean};
  svg?: VisualWaveform;
  haptic?: HapticData;
  settings?: OathSettings;
  sessionId?: string;
  clipId?: string;
  notes?: string;
  markers: ClipMarker[];
  lastUpdate: number;
  trimAt?: number;
}

/**
 * Save current project assets to destination
 * @param action - The action name
 * @param forceDestination - Flag to force save destination dialog
 * @returns The IPC message to send back to the UI
 */
export async function saveProject(
  action: string,
  forceDestination = false,
  notifySocket = true,
): Promise<IPCMessage> {
  try {
    let projectName = Project.instance.getName();
    let {projectFile} = Configs.instance.getCurrentProject();

    if (!Project.instance.hasContent()) {
      return {action, status: 'error', message: 'Cannot find data to save'};
    }

    const projectFileExt = Configs.configs.app.projectFile.extension;
    const projectDir = projectFile ? path.dirname(projectFile) : null;
    const defaultPath =
      projectDir && fs.existsSync(projectDir)
        ? projectDir
        : PathManager.instance.getHomePath();
    const projectFileExists = !isNil(projectFile) && fs.existsSync(projectFile);

    // Set the default project name for untitled projects
    if (isUntitledProject(projectName)) {
      const clips = Project.instance.getClips();
      projectName =
        clips.length === 1
          ? clips[0].name
          : `${Constants.DEFAULT_PROJECT_NAME}-${countUntitledProjects(defaultPath) + 1}`;
    }

    // If the save dialog is forced or the destination dir is missing, open the save dialog
    if (forceDestination || !projectFileExists) {
      const window = MainApplication.instance.getMainWindow();
      if (window) {
        // If the project does not have a saved destination, default to the user home path
        projectFile = dialog.showSaveDialogSync(window, {
          defaultPath: path.join(
            defaultPath,
            `${projectName}${projectFileExt}`,
          ),
          title: 'Save project',
          properties: ['createDirectory'],
          buttonLabel: 'Save',
        });

        // If save is canceled, do nothing
        if (isNil(projectFile)) {
          return {action, status: 'canceled'};
        }
      }
    }

    // Return an error if the destination folder is missing
    if (isNil(projectFile)) {
      return {
        action,
        status: 'error',
        message: 'Error selecting destination file',
      };
    }

    // Update the project name based on the project file name
    projectName = path.basename(projectFile, path.extname(projectFile));
    Project.instance.updateName(projectName);

    // Ensure that the project file has the right extension
    // and get the project name from the file name
    if (path.extname(projectFile) !== projectFileExt) {
      Configs.instance.removeRecentProject({projectFile, name: projectName});
      projectFile = path.join(
        path.dirname(projectFile),
        `${projectName}${projectFileExt}`,
      );
    }

    const isTutorial = isBuiltInTutorial(projectFile);
    const isAuthoringTutorial = isCustomTutorial(projectFile);

    if (Project.instance.hasContent()) {
      // Force persisting the project content on destination
      await Project.instance.save(projectFile);
      // Set the project dir as the new home
      PathManager.instance.setPath('home', path.dirname(projectFile));

      // Save into the project file if the project is a tutorial
      Project.instance.setTutorialMetadata(isTutorial, isAuthoringTutorial);
    }

    // Set the current project dir, this removes tmpDir from the current project and sets the dirty flag to false
    Configs.instance.setCurrentProject({
      projectFile,
      name: projectName,
      dirty: false,
      tmpProjectFile: Project.instance.getProjectFile(),
    });

    // Add the project to the recent list
    Configs.instance.addRecentProject({projectFile, name: projectName});

    // Send Current Project to the HMD
    if (notifySocket) {
      WSServer.instance.sendCurrentProject();
    }

    // Reload menu items
    MainApplication.instance.reloadMenuItems();

    // Send the project info to the UI
    MainApplication.instance.sendToUI('project_info', {
      action,
      status: 'ok',
      payload: {name: projectName, isTutorial, isAuthoringTutorial},
    });

    return Promise.resolve({action, status: 'ok', payload: {}});
  } catch (error) {
    const err = error as Error;
    Logger.logError(err);
    return Promise.resolve({
      action,
      status: 'error',
      message: (error as Error).message,
    });
  }
}

/**
 * If the current project file is missing or moved, asks for save forcing the selection of the destination
 * @param {string} action - The action name
 * @param {string} projectFile - The project file
 * @returns {IPCMessage} - The IPC message to send back to the UI
 */
export async function checkForCurrentProject(
  action: string,
  projectFile: string,
): Promise<IPCMessage> {
  let message: IPCMessage = {action, status: 'ok', payload: {}};
  const window = MainApplication.instance.getMainWindow();
  if (projectFile && !fs.existsSync(projectFile) && window) {
    const res: number = dialog.showMessageBoxSync(window, {
      type: 'question',
      title: '',
      message: `Current project file ${projectFile} seems to be missing or moved. Do you want to save it?`,
      buttons: ['Yes', 'No', 'Cancel'],
      cancelId: 2,
    });
    switch (res) {
      // if save is confirmed, save the current project
      case 0: {
        message = await saveProject('save', true);
        break;
      }
      default:
        break;
    }
  }
  return message;
}

/**
 * Closes the current project
 * @param {string} action - The action name
 * @returns {IPCMessage} - The IPC message to send back to the UI
 */
export async function closeProject(action: string): Promise<IPCMessage> {
  const {dirty, projectFile, name} = Configs.instance.getCurrentProject();

  // If the project has been modified, ask to save. Note: The tutorial is not supposed to be saved
  if (dirty && !Project.instance.isTutorial()) {
    const mainWindow = MainApplication.instance.getMainWindow();
    if (mainWindow) {
      // res: 0 == 'Yes', 1 == 'No', 2 == 'Cancel'
      const res: number = dialog.showMessageBoxSync(mainWindow, {
        type: 'question',
        title: '',
        message: `Unsaved project found: ${name}. Do you want to save it?`,
        buttons: ['Yes', 'No', 'Cancel'],
        cancelId: 2,
      });
      switch (res) {
        // if save on close is confirmed, save the current project
        case 0: {
          const saveResponse = await saveProject('save', false, false);
          if (saveResponse.status === 'canceled') {
            return {action, status: 'canceled', payload: {}};
          }
          MainApplication.instance.sendToUI('save', saveResponse);
          break;
        }
        case 2:
          return {action, status: 'canceled', payload: {}};
        default:
          break;
      }
    }
  } else if (projectFile) {
    await checkForCurrentProject(action, projectFile);
  }

  // Clear current project
  Configs.instance.clearCurrentProject();

  // Clear current audio
  Project.instance.clearCurrentAudio();

  // Refresh recent projects in menu item
  MainApplication.instance.reloadMenuItems();

  // Notify the socket
  WSServer.instance.sendProjectClose();

  return {action, status: 'ok', payload: {}};
}

/**
 * Load all projects assets
 * @param {string} action - The action name
 * @param {string} projectFile - The project file to open
 * @param {boolean} dirty - flag that indicates if the current project is dirty
 * @param {boolean} loadFromDisk - flag that indicates if the project needs to be loaded from disk
 * @returns {IPCMessage} - The IPC message to send back to the UI
 */
export async function loadProject(
  action: string,
  projectFile?: string,
  dirty = false,
  loadFromDisk = true,
): Promise<IPCMessage> {
  try {
    if (!projectFile) {
      return {
        action,
        status: 'error',
        message: 'Project file missing',
      };
    }
    const exists = promisify(fs.exists);

    // if I'm not opening the current project
    const currentProject = Configs.instance.getCurrentProject();
    if (
      !isEmpty(currentProject) &&
      currentProject.tmpProjectFile !== projectFile &&
      currentProject.projectFile !== projectFile
    ) {
      // close the current project
      const response = await closeProject(action);
      if (response.status === 'canceled') {
        return response;
      }
    }

    if (loadFromDisk) {
      // load the new project
      await Project.instance.load(projectFile);
    }

    if (!Project.instance.hasContent()) {
      return {
        action,
        status: 'error',
        message: `Project file not found in ${projectFile}`,
      };
    }

    let isSample = isSampleProject(projectFile);
    const isTutorial = isBuiltInTutorial(projectFile);
    const isAuthoringTutorial = isCustomTutorial(projectFile);
    let isDirty = dirty;

    const clips = Project.instance.getClips();
    const groups = Project.instance.getGroups();
    const state = Project.instance.getState();
    let {sessionId} = state;
    const payloadClips: ClipPayload[] = [];

    // Save into the project file if the project is a tutorial
    Project.instance.setTutorialMetadata(isTutorial, isAuthoringTutorial);

    // If the project is a sample or the sessionId is missing,
    // create a new session for the project
    if (isEmpty(sessionId)) {
      sessionId = Project.instance.createSession();
      Logger.debug(`New session created ${sessionId}`);
      Project.instance.updateState('', sessionId);
      isDirty = true;
    }

    // iterate all clips of the project file
    for (let index = 0; index < clips.length; index += 1) {
      const clip = clips[index];
      // Load audio, haptic, SVG and settings file for last clip
      const {
        waveform,
        audioAsset,
        settings,
        clipId,
        name,
        notes,
        markers = [],
        lastUpdate = Date.now(),
      } = clip;
      const audioFileExists =
        audioAsset && audioAsset.path ? await exists(audioAsset.path) : false;

      if (
        clip.audioAsset &&
        clip.audioAsset.path &&
        clip.audioAsset.path.startsWith(PathManager.instance.getResourcesPath())
      ) {
        isSample = true;
      }

      const svg = waveform;
      const payloadClip: ClipPayload = {
        name,
        audio: audioAsset
          ? {...audioAsset, exists: audioFileExists}
          : undefined,
        svg,
        haptic: clip.haptic,
        settings: settings || {},
        trimAt: clip.trimAt,
        clipId,
        sessionId,
        notes,
        markers,
        lastUpdate,
      };

      payloadClips.push(payloadClip);
    }

    const projectName = Project.instance.getName();
    const {description, category, slug, version} =
      Project.instance.getMetadata();

    // if project file is a tmp file, it means that it's the current project
    // so it does not need to be added to recent projects or set as current
    if (!Project.isTmpProject(projectFile) && !isSample) {
      // set current project
      Configs.instance.setCurrentProject({
        projectFile,
        name: projectName,
        dirty: isDirty,
        tmpProjectFile: Project.instance.getProjectFile(),
      });

      // Add the project to the recent list
      Configs.instance.addRecentProject({projectFile, name: projectName});
    }

    // when opening a sample project
    // mark it as dirty so the user knows that it needs to be saved
    if (isSample) {
      // set current project as dirty project with tmpProjectFile
      Configs.instance.setCurrentProject({
        tmpProjectFile: Project.instance.getProjectFile(),
        name: projectName,
        dirty: false,
      });
      // @oss-disable
      // @oss-disable
        // @oss-disable
      // @oss-disable
    }

    // Send Current Project to the HMD
    WSServer.instance.sendCurrentProject();

    // Reload menu items
    MainApplication.instance.reloadMenuItems();

    const lastOpenedClipId = !isSample
      ? Project.instance.getCurrentClip()?.clipId
      : undefined;

    // @oss-disable
    // @oss-disable
      // @oss-disable
      // @oss-disable
        // @oss-disable
        // @oss-disable
      // @oss-disable
    // @oss-disable
    if (
      !isTutorial &&
      currentProject.projectFile &&
      fs.existsSync(currentProject.projectFile)
    ) {
      // If the project is not a tutorial, set the project dir as the new home
      PathManager.instance.setPath(
        'home',
        path.dirname(currentProject.projectFile),
      );
    }

    return {
      action,
      status: 'ok',
      payload: {
        groups,
        clips: payloadClips,
        name: projectName,
        description,
        category,
        slug,
        version,
        sessionId,
        lastOpenedClipId,
        projectExists: true,
        isSample,
        isTutorial: Project.instance.isTutorial(),
        isAuthoringTutorial: Project.instance.isAuthoringTutorial(),
      },
    };
  } catch (error) {
    const err = error as Error;
    Logger.error(err.message, err.stack);
    return {action, status: 'error', message: (error as Error).message};
  }
}

/**
 * Clones the current haptic of the current project
 * @param {string} action - The action name
 * @returns {IPCMessage} - The IPC message to send back to the UI
 */
export async function cloneProject(action: string): Promise<IPCMessage> {
  const exists = promisify(fs.exists);
  const unlink = promisify(fs.unlink);

  let message: IPCMessage = {action, status: 'ok', payload: {}};
  // Get the current project before cloning the project
  const prevProject = Configs.instance.getCurrentProject();

  try {
    let projectName = Project.instance.getName();
    let {projectFile} = Configs.instance.getCurrentProject();

    if (!Project.instance.hasContent()) {
      return {action, status: 'error', message: 'Cannot find data to save'};
    }

    const projectFileExt = Configs.configs.app.projectFile.extension;
    const projectDir = projectFile ? path.dirname(projectFile) : null;
    const defaultPath =
      projectDir && fs.existsSync(projectDir)
        ? projectDir
        : PathManager.instance.getHomePath();
    const window = MainApplication.instance.getMainWindow();

    // Set default project name for untitled projects
    if (isUntitledProject(projectName)) {
      const clips = Project.instance.getClips();
      projectName =
        clips.length === 1
          ? clips[0].name
          : `${Constants.DEFAULT_PROJECT_NAME}-${countUntitledProjects(defaultPath) + 1}`;
    }

    if (window) {
      // If the project does not have a saved destination, default to the user home path
      projectFile = dialog.showSaveDialogSync(window, {
        defaultPath: path.join(defaultPath, `${projectName}${projectFileExt}`),
        title: 'Save project',
        properties: ['createDirectory'],
        buttonLabel: 'Save',
      });
    }

    // Return error if the destination folder is missing
    if (isNil(projectFile)) {
      return {action, status: 'canceled'};
    }

    // Ensure that the project file has the right extension
    // and get the project name from the file name
    projectFile = projectFile.endsWith(projectFileExt)
      ? projectFile
      : `${projectFile}${projectFileExt}`;
    projectName = path.basename(projectFile, path.extname(projectFile));

    const clonedContent = Project.instance.getExportableContent();
    clonedContent.metadata = {...clonedContent.metadata, name: projectName};
    clonedContent.state = {
      ...clonedContent.state,
      sessionId: Project.instance.createSession(),
    };

    // Save the clone project
    saveJSONFile(projectFile, {});
    // Update cloned content with the relative assets paths
    Project.setRelativeAssetsPath(
      clonedContent,
      projectFile,
      Project.instance.getProjectFile(),
    );
    // Save the clone project
    saveJSONFile(projectFile, omit(clonedContent, ['updatedAt']));

    // Set the project dir as new home
    PathManager.instance.setPath('home', path.dirname(projectFile));

    // Clear the current project and load the cloned one
    Configs.instance.clearCurrentProject();
    message = await loadProject('open', projectFile, false);
  } catch (error) {
    const err = error as Error;
    Logger.error(err.message, err.stack);
    message = {action, status: 'error', message: (error as Error).message};
    // If there is an error cloning the project, rollback to the previous project
    const currentProject = Configs.instance.getCurrentProject();
    /**
     * If the current project has changed, it means that the cloned project is now the current,
     * and we need to restore the project that was the current before the clone action
     */
    if (!isEqual(prevProject, Configs.instance.getCurrentProject())) {
      // Clear the project file created for the cloned haptic
      if (
        currentProject.projectFile &&
        (await exists(currentProject.projectFile))
      ) {
        await unlink(currentProject.projectFile);
        // Remove the cloned project from recent projects
        Configs.instance.removeRecentProject({
          projectFile: currentProject.projectFile,
          name: currentProject.name,
        });
      }
      // Restore the previous project as current
      Configs.instance.setCurrentProject(prevProject);

      // Send Current Project to the HMD
      WSServer.instance.sendCurrentProject();

      // Reload menu items
      MainApplication.instance.reloadMenuItems();
    }
  }
  return message;
}

export function setCurrentClip(clipId: string): void {
  const {sessionId} = Project.instance.getState();
  if (!Project.instance.hasContent()) {
    Project.instance.create(Constants.DEFAULT_PROJECT_NAME);
    // @oss-disable
    // @oss-disable
      // @oss-disable
    // @oss-disable
  }
  const clip = Project.instance.getClipById(clipId);
  if (clip && !isEmpty(clipId) && !isEmpty(sessionId)) {
    Project.instance.updateState(clipId, sessionId);
    if (clip.audioAsset && clip.audioAsset.path) {
      // Load the current audio clip in cache
      Project.instance.loadCurrentAudio(clip.audioAsset.path);
    }
  }
}

/**
 * Creates a new empty project
 * - Closes the current project first
 * - Creates a new empty project and sets it as current
 * - Opens the new project
 * @param action the 'new' action
 */
export async function newProject(action: string): Promise<IPCMessage> {
  // Close the current project
  const closeMessage = await closeProject(action);
  if (closeMessage.status !== 'ok') {
    return closeMessage;
  }

  // Create a new project file if there is no current project loaded
  if (!Project.instance.hasContent()) {
    Project.instance.create(Constants.DEFAULT_PROJECT_NAME);
    // @oss-disable
    // @oss-disable
      // @oss-disable
    // @oss-disable

    Configs.instance.setCurrentProject({
      tmpProjectFile: Project.instance.getProjectFile(),
      name: Project.instance.getName(),
      dirty: false,
    });
  }

  return loadProject('open', Project.instance.getProjectFile(), false);
}
