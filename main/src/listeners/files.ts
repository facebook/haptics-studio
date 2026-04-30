/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {shell} from 'electron';
import {IpcInvokeChannel, IpcSendChannel} from '../../../shared';
import {createIPCHandler, createIPCListener} from './ipcHandlerUtils';
import Configs, {ProjectMetadata} from '../common/configs';
import {verifyAudioFile} from '../common/utils';
import Project from '../common/project';
import * as Actions from '../actions/files';

export interface FileSelectedMessage {
  file: string;
}

export interface FileContent {
  path: string;
  name: string;
}

export interface AddFilesMessage {
  properties?: Array<'openDirectory' | 'openFile'>;
}

export interface OpenFolderMessage {
  path: string;
}

/**
 * Loads sample projects
 */
function handleSamples(): void {
  createIPCHandler<void, {samples: ProjectMetadata[]}>(IpcInvokeChannel.Samples, () => {
    const samples = Configs.getSamplesProjects().sort((a, b) => {
      return (a.order ?? 0) - (b.order ?? 0);
    });
    return {payload: {samples}};
  });
}

/**
 * Allow the user to select a folder or a file to add to the project
 */
function addFiles(): void {
  createIPCHandler<AddFilesMessage>(IpcInvokeChannel.AddFiles, args => {
    const {properties = ['openDirectory', 'openFile']} = args ?? {};
    const result = Actions.addFiles('add_files', properties);
    return {customResponse: result};
  });
}

/**
 * Loads recent projects from JSON settings and sends them back to the UI
 */
function handleRecentProjects(): void {
  createIPCHandler<
    void,
    {projects: Array<ProjectMetadata & {error: string | undefined}>}
  >(IpcInvokeChannel.RecentProjects, () => {
    const projects = Configs.instance
      .getRecentProjects()
      .map((project: ProjectMetadata) => ({
        ...project,
        error: Project.getProjectError(project),
      }));
    return {payload: {projects}};
  });
}

/**
 * Validates a selected file from the UI
 */
function fileSelected(): void {
  createIPCHandler<FileSelectedMessage>(IpcInvokeChannel.FileSelected, async args => {
    await verifyAudioFile(args.file);
  });
}

/**
 * Opens the dialog to select a project file
 */
function openProject(): void {
  createIPCHandler<void>(IpcInvokeChannel.OpenProject, async () => {
    await Actions.openProject();
  });
}

/**
 * Opens the system folder at the given path
 */
function openSystemFolderAt(): void {
  createIPCListener<OpenFolderMessage>(IpcSendChannel.OpenSystemFolderAt, args => {
    shell.showItemInFolder(args.path);
  });
}

/**
 * Opens the last known export folder
 */
function openExportFolder(): void {
  createIPCListener<void>(IpcSendChannel.OpenExportFolder, () => {
    void shell.openPath(Configs.configs.lastExportedPath);
  });
}

/**
 * Bind IPC messages
 */
export default function (): void {
  fileSelected();
  handleSamples();
  addFiles();
  handleRecentProjects();
  openProject();
  openSystemFolderAt();
  openExportFolder();
}
