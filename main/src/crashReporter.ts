/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';
import {app, crashReporter} from 'electron';
import rimraf from 'rimraf';
import fs from 'fs';

import {PathManager} from './services';
import Logger from './common/logger';
import Analytics, {ErrorType} from './analytics';

export default class CrashReporter {
  private crashDumpsFolder = '';

  /**
   * @constructor CrashReporter
   * @param folder Optional, the folder where the crash dumps will be stored, defaults to [userData]/crashDumps
   */
  constructor(crashPath?: string) {
    this.crashDumpsFolder =
      crashPath ?? path.join(app.getPath('userData'), 'crashDumps');
    Logger.debug('crashDumpsFolder', this.crashDumpsFolder);
    PathManager.instance.setPath('crashDumps', this.crashDumpsFolder);

    if (process.env.NODE_ENV === 'test') {
      return;
    }

    crashReporter.start({
      uploadToServer: false,
    });
  }

  /**
   * Cause a test crash
   */
  public static testCrash(): void {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    setTimeout(() => {
      // Force a crash
      Logger.error('Forcing a crash for testing purposes');
      process.crash();
    }, 5000);
  }

  /**
   * Send the pending crash reports
   */
  public sendCrashReports(): void {
    const pendingCrashesFolder = path.join(this.crashDumpsFolder, 'pending');
    if (fs.existsSync(pendingCrashesFolder)) {
      const files = fs.readdirSync(pendingCrashesFolder);
      files.forEach((file: string) => {
        const crashfilePath = path.join(pendingCrashesFolder, file);
        const crashFileStats = fs.lstatSync(crashfilePath);
        Logger.debug(
          `Found a crash to report in date: ${crashFileStats.ctime.toISOString()}`,
        );
        Analytics.instance.addErrorEvent({
          type: ErrorType.crash,
          error_name: 'system_crash',
          timestamp: crashFileStats.ctime.getTime(),
          stack_trace: '',
        });
      });

      // Cleanup pending crashes
      rimraf(path.join(pendingCrashesFolder, '*'), () => {
        Logger.debug('Deleted pending crashes folder');
      });
    }
  }
}
