/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {app} from 'electron';
import {IpcInvokeChannel, IpcSendChannel} from '../../../shared';
import {createIPCHandler, createIPCListener} from './ipcHandlerUtils';
import MainApplication from '../application';
import Configs from '../common/configs';

/**
 * Accept terms and conditions
 */
function termsAndConditions(): void {
  createIPCHandler<{termsAccepted: boolean}>(IpcInvokeChannel.TermsAndConditions, args => {
    Configs.instance.set('termsAccepted', args.termsAccepted);
    MainApplication.instance.reloadMenuItems();
    return {payload: {termsAccepted: args.termsAccepted}};
  });
}

function quitApplication(): void {
  createIPCListener<void>(IpcSendChannel.QuitApplication, () => {
    app.quit();
  });
}

/**
 * Bind IPC messages
 */
export default function (): void {
  quitApplication();
  termsAndConditions();
}
