/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {app, clipboard, shell} from 'electron';
import {IpcInvokeChannel, IpcSendChannel} from '../../../shared';
import type {
  OpenExternalUrlRequest,
  RendererFatalErrorRequest,
  WriteClipboardTextRequest,
} from '../../../shared';
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

const ALLOWED_EXTERNAL_HOSTS = new Set([
  'developer.oculus.com',
  'developers.meta.com',
  'github.com',
  'www.meta.com',
  'www.youtube.com',
]);

export function isAllowedExternalUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    return (
      url.protocol === 'https:' && ALLOWED_EXTERNAL_HOSTS.has(url.hostname)
    );
  } catch {
    return false;
  }
}

function openExternalUrl(): void {
  createIPCListener<OpenExternalUrlRequest>(
    IpcSendChannel.OpenExternalUrl,
    args => {
      if (!isAllowedExternalUrl(args?.url)) {
        throw new Error('Refusing to open a non-allowlisted HTTPS URL');
      }
      void shell.openExternal(args.url);
    },
  );
}

function writeClipboardText(): void {
  createIPCListener<WriteClipboardTextRequest>(
    IpcSendChannel.WriteClipboardText,
    args => {
      clipboard.writeText(args.text);
    },
  );
}

/**
 * Bind IPC messages
 */
export default function (): void {
  quitApplication();
  rendererFatalError();
  openExternalUrl();
  writeClipboardText();
  termsAndConditions();
}
