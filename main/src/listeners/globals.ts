/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {app} from 'electron';
import {IpcInvokeChannel, IpcSendChannel} from '../../../shared';
import type {RendererFatalErrorRequest} from '../../../shared';
import {createIPCHandler, createIPCListener} from './ipcHandlerUtils';
import MainApplication from '../application';
import Configs from '../common/configs';
import Logger from '../common/logger';

/**
 * Accept terms and conditions
 */
function termsAndConditions(): void {
  createIPCHandler<{termsAccepted: boolean}>(
    IpcInvokeChannel.TermsAndConditions,
    args => {
      Configs.instance.set('termsAccepted', args.termsAccepted);
      MainApplication.instance.reloadMenuItems();
      return {payload: {termsAccepted: args.termsAccepted}};
    },
  );
}

function quitApplication(): void {
  createIPCListener<void>(IpcSendChannel.QuitApplication, () => {
    app.quit();
  });
}

/**
 * The renderer hit an unrecoverable error, log it.
 */
function rendererFatalError(): void {
  createIPCListener<RendererFatalErrorRequest>(
    IpcSendChannel.RendererFatalError,
    args => {
      Logger.logError(new Error(`Renderer fatal error: ${args?.message}`));
    },
  );
}

/**
 * Bind IPC messages
 */
export default function (): void {
  quitApplication();
  rendererFatalError();
  termsAndConditions();
}
