/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Updater class
 */
import {dialog, MenuItem} from 'electron';
import {autoUpdater, UpdateInfo} from 'electron-updater';
import {toInteger} from 'lodash';

import MainApplication from './application';
import Logger from './common/logger';
import {getReleaseChannel} from './common/utils';
import Configs from './common/configs';
import Constants from './common/constants';

const singletonEnforcer = Symbol('singletonEnforcer');

export interface ProgressInfo {
  total: number;
  delta: number;
  transferred: number;
  percent: number;
  bytesPerSecond: number;
}

export default class Updater {
  /**
   * Static
   * Unset a configuration element
   */
  public static checkForUpdates(silent = true): void {
    return Updater.instance.checkForUpdates(silent);
  }

  private menuItem: MenuItem | undefined;

  private silent: boolean;

  private static singleton: Updater;

  /**
   * Represents an instance of the application configurations handler
   * @constructor
   * */
  constructor(enforcer: symbol) {
    if (enforcer !== singletonEnforcer) {
      throw new Error('Cannot construct singleton');
    }
    this.menuItem = MainApplication.instance
      .getApplicationMenu()
      ?.getMenuItemById('updater') as MenuItem;
    this.silent = true;

    autoUpdater.autoDownload = false;
    autoUpdater.logger = Logger;
    autoUpdater.fullChangelog = true;
    autoUpdater.channel = getReleaseChannel();
    autoUpdater.allowDowngrade = false;
    autoUpdater.setFeedURL(Constants.AUTO_UPDATER.FEED_URL);

    autoUpdater.on('error', (error: Error) => {
      MainApplication.instance.sendToUI('update_error');
      Logger.logError(error);
      this.resetMenuItem();
    });

    autoUpdater.on('update-available', (updateInfo: UpdateInfo) => {
      MainApplication.instance.sendToUI('update_available', updateInfo);
    });

    autoUpdater.on('update-not-available', () => {
      if (!this.silent) {
        void dialog.showMessageBox({
          title: 'No Updates',
          message: 'Current version is up-to-date.',
        });
      }
      this.resetMenuItem();
    });

    autoUpdater.on('download-progress', (progressObj: ProgressInfo) => {
      const progress = toInteger(progressObj.percent);
      MainApplication.instance.sendToUI('download_progress', {progress});
    });

    autoUpdater.on('update-downloaded', () => {
      this.updateMenuItem('Update downloaded...', false);
      MainApplication.instance.sendToUI('update_downloaded');
    });
  }

  /**
   * Returns the current instance
   * @return { Updater } - Current Updater instance
   * */
  static get instance(): Updater {
    if (!Updater.singleton) {
      Updater.singleton = new Updater(singletonEnforcer);
    }
    return Updater.singleton;
  }

  // export this to MenuItem click callback
  public checkForUpdates = (silent = true): void => {
    const {app} = Configs.configs;
    if (app.env === 'production') {
      this.silent = silent;
      this.updateMenuItem('Updating...', false);
      void autoUpdater.checkForUpdatesAndNotify();
    } else {
      Logger.info('Skipping the update check...');
    }
  };

  private resetMenuItem = (): void => {
    this.updateMenuItem('Check for Updates...', true);
  };

  public updateMenuItem = (label: string, enabled: boolean): void => {
    this.menuItem = MainApplication.instance
      .getApplicationMenu()
      ?.getMenuItemById('updater') as MenuItem;
    if (this.menuItem) {
      this.menuItem.enabled = enabled;
      this.menuItem.label = label;
      MainApplication.instance.reloadMenuItems();
    }
  };
}
