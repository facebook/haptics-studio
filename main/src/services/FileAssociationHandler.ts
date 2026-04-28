/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * FileAssociationHandler - Handles OS-level file association events
 *
 * Manages:
 * - macOS open-file events (double-click .haptic / project files in Finder)
 * - Windows single-instance lock and second-instance argv forwarding
 * - Determining whether a file is a supported project type
 * - Opening associated project files via the project loader
 */

import {isEmpty} from 'lodash';
import path from 'path';
import fs from 'fs';
import {app} from 'electron';

import Logger from '../common/logger';
import Constants from '../common/constants';
import {getProjectToOpen, isOnWindows} from '../common/utils';
import {loadProject} from '../actions/project';

export interface FileAssociationCallbacks {
  sendToUI: (action: string, message: any) => void;
}

export default class FileAssociationHandler {
  public selectedProjectFile: string | undefined;

  private callbacks: FileAssociationCallbacks;

  constructor(callbacks: FileAssociationCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Register the early open-file handler (before app is ready).
   * On macOS, stores the file path so it can be opened once the window loads.
   */
  registerEarlyOpenFile = (): void => {
    app.on('open-file', (event, filePath) => {
      event.preventDefault();
      if (!app.isReady()) {
        this.setSelectedProjectFile(filePath);
      }
    });
  };

  /**
   * Register all file-association event handlers for after the app is ready.
   * Includes the macOS open-file handler and Windows single-instance logic.
   *
   * @returns false if this is a secondary Windows instance that should quit
   */
  registerAppReadyHandlers = (): boolean => {
    // macOS: handle files opened while the app is already running
    app.on('open-file', (event, filePath) => {
      event.preventDefault();
      this.loadAssociatedFileType(filePath);
    });

    if (isOnWindows()) {
      const primaryInstance = app.requestSingleInstanceLock();
      if (!primaryInstance) {
        Logger.info('Quitting secondary app.');
        app.quit();
        return false;
      }

      // Get path from argv on Windows
      if (process.argv.length >= 2) {
        const filePath = process.argv[process.argv.length - 1];
        this.loadAssociatedFileType(filePath, false);
      }

      // Handle files opened when a second instance is launched
      app.on('second-instance', (_event, argv) => {
        if (argv.length >= 2) {
          const filePath = argv[argv.length - 1];
          this.loadAssociatedFileType(filePath);
        }
      });
    }

    return true;
  };

  /**
   * Determines the file type and either sends it to the UI or opens it as a project.
   */
  loadAssociatedFileType = (filePath: string, open = true): void => {
    if (filePath.endsWith('.haptic')) {
      this.callbacks.sendToUI('open_haptic', {payload: {path: filePath}});
    } else {
      this.setSelectedProjectFile(filePath);
      if (open) {
        this.openFile(filePath);
      }
    }
  };

  /**
   * Validates and stores the project file path if it is a supported extension.
   */
  setSelectedProjectFile = (projectFile: string): void => {
    const projectFileExtension = path.extname(projectFile);
    const isSupportedProject =
      Constants.PROJECT.SUPPORTED_EXTENSIONS.includes(projectFileExtension);
    if (
      !isEmpty(projectFile) &&
      fs.existsSync(projectFile) &&
      isSupportedProject
    ) {
      this.selectedProjectFile = projectFile;
    } else if (projectFile) {
      Logger.warn('Unsupported project file', projectFile);
    }
  };

  /**
   * Opens the project file via the project loader and sends the result to the UI.
   */
  private openFile = (filePath: string): void => {
    Logger.info('open-file', filePath);
    if (this.selectedProjectFile && app.isReady()) {
      const {projectToOpen, isDirty} = getProjectToOpen(filePath);
      if (projectToOpen !== filePath) {
        this.selectedProjectFile = undefined;
      }
      void loadProject('open', projectToOpen, isDirty).then(message => {
        this.callbacks.sendToUI('open', message);
      });
    }
  };
}
