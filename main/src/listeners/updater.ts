/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {dialog} from 'electron';
import {autoUpdater} from 'electron-updater';
import {IpcInvokeChannel} from '../../../shared';
import {createIPCHandler} from './ipcHandlerUtils';
import MainApplication from '../application';
import Updater from '../updater';

function downloadUpdate() {
  createIPCHandler<void>(IpcInvokeChannel.DownloadUpdate, () => {
    Updater.instance.updateMenuItem('Downloading...', false);
    void autoUpdater.downloadUpdate();
  });
}

function quitAndInstall() {
  createIPCHandler<void>(IpcInvokeChannel.QuitAndInstall, () => {
    const window = MainApplication.instance.getMainWindow();
    if (window) {
      dialog.showMessageBoxSync(window, {
        title: 'Install Updates',
        message:
          'Update ready to install, Haptics Studio will now restart to apply the update...',
      });
      autoUpdater.autoInstallOnAppQuit = false;
      autoUpdater.quitAndInstall(true, true);
    }
  });
}

/**
 * Bind IPC messages
 */
export default function (): void {
  downloadUpdate();
  quitAndInstall();
}
