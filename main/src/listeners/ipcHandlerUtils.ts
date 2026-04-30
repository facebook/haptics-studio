/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * IPC Handler Utilities
 *
 * This module provides wrapper functions to reduce boilerplate code in IPC handlers.
 * It centralizes common patterns like logging, error handling, and post-action hooks.
 */

import {ipcMain, IpcMainEvent, IpcMainInvokeEvent} from 'electron';
import Logger from '../common/logger';
import Configs from '../common/configs';
import WSServer from '../wsServer';
import MainApplication from '../application';
import {IPCMessage, IPCStatus} from './index';

/**
 * Options for configuring IPC handler behavior
 */
export interface IPCHandlerOptions {
  /** Mark the current project as dirty after successful execution */
  markDirty?: boolean;
  /** Send current project via WebSocket after successful execution */
  sendWSProject?: boolean;
  /** Send clip update via WebSocket after successful execution */
  sendWSClipUpdate?: boolean;
  /** Reload application menu items after successful execution */
  reloadMenu?: boolean;
  /** Custom response action name (defaults to handler action) */
  responseAction?: string;
}

/**
 * Result type for handler functions
 */
export type HandlerResult<T = Record<string, unknown>> = {
  status?: IPCStatus;
  payload?: T;
  message?: string;
  /** Full custom response (bypasses normal response building) */
  customResponse?: IPCMessage<T>;
};

/**
 * Marks the current project as dirty (has unsaved changes)
 */
export function markProjectDirty(): void {
  Configs.instance.setCurrentProject({
    ...Configs.instance.getCurrentProject(),
    dirty: true,
  });
}

/**
 * Executes common post-action hooks based on options
 */
export function executePostActions(options: IPCHandlerOptions): void {
  if (options.markDirty) {
    markProjectDirty();
  }
  if (options.sendWSProject) {
    WSServer.instance.sendCurrentProject();
  }
  if (options.sendWSClipUpdate) {
    WSServer.instance.sendClipUpdate();
  }
  if (options.reloadMenu) {
    MainApplication.instance.reloadMenuItems();
  }
}

/**
 * Creates a standardized IPC response message
 */
export function createResponse<T = Record<string, unknown>>(
  action: string,
  status: IPCStatus,
  payload?: T,
  message?: string,
): IPCMessage<T> {
  const response: IPCMessage<T> = {action, status};
  if (payload !== undefined) {
    response.payload = payload;
  }
  if (message !== undefined) {
    response.message = message;
  }
  return response;
}

/**
 * Creates an error response from an Error object
 */
export function createErrorResponse(
  action: string,
  error: unknown,
  logError = true,
): IPCMessage<Record<string, unknown>> {
  const err = error as Error;
  if (logError) {
    Logger.logError(err);
  }
  return createResponse(action, 'error', {}, err.message);
}

/**
 * Handler function type for ipcMain.handle (request-response pattern)
 * Returns a result object or void (defaults to success with empty payload)
 */
export type IPCHandlerFn<TArgs, TResult = Record<string, unknown>> = (
  args: TArgs,
  event: IpcMainInvokeEvent,
) =>
  | HandlerResult<TResult>
  | Promise<HandlerResult<TResult>>
  | void
  | Promise<void>;

/**
 * Creates an IPC handler using ipcMain.handle (request-response pattern)
 *
 * @param action - The IPC action/channel name
 * @param handler - The handler function that processes the request
 * @param options - Configuration options for post-action hooks
 *
 * @example
 * ```typescript
 * createIPCHandler<{clipId: string; name: string}>(
 *   'update_clip_name',
 *   (args) => {
 *     const clip = Project.instance.getClipById(args.clipId);
 *     if (clip) {
 *       Project.instance.updateClip(args.clipId, {...clip, name: args.name});
 *     }
 *   },
 *   {markDirty: true, sendWSProject: true, reloadMenu: true}
 * );
 * ```
 */
export function createIPCHandler<
  TArgs = unknown,
  TResult = Record<string, unknown>,
>(
  action: string,
  handler: IPCHandlerFn<TArgs, TResult>,
  options: IPCHandlerOptions = {},
): void {
  ipcMain.handle(action, async (event, args: TArgs) => {
    Logger.debug(`ipcMain handle ${action}`, args);

    try {
      const result = await handler(args, event);

      // If handler returns a custom response, return it directly
      // Only execute post-actions if the custom response indicates success
      if (result?.customResponse) {
        if (
          result.customResponse.status === 'ok' ||
          result.customResponse.status === undefined
        ) {
          executePostActions(options);
        }
        return result.customResponse;
      }

      // Build response
      const status: IPCStatus = result?.status ?? 'ok';
      const payload = result?.payload ?? ({} as TResult);
      const message = result?.message;

      // Only execute post-action hooks on success (status is 'ok' or undefined)
      if (status === 'ok' || status === undefined) {
        executePostActions(options);
      }

      return createResponse(action, status, payload, message);
    } catch (error) {
      return createErrorResponse(action, error);
    }
  });
}

/**
 * Listener function type for ipcMain.on (fire-and-forget pattern)
 */
export type IPCListenerFn<TArgs> = (
  args: TArgs,
  event: IpcMainEvent,
) => void | Promise<void>;

/**
 * Creates an IPC listener using ipcMain.on (fire-and-forget pattern)
 *
 * @param action - The IPC action/channel name
 * @param listener - The listener function that processes the event
 * @param options - Configuration options for post-action hooks
 *
 * @example
 * ```typescript
 * createIPCListener(
 *   'play_audio',
 *   () => {
 *     MainApplication.instance.sendToUI('play_audio');
 *   }
 * );
 * ```
 */
export function createIPCListener<TArgs = unknown>(
  action: string,
  listener: IPCListenerFn<TArgs>,
  options: IPCHandlerOptions = {},
): void {
  ipcMain.on(action, (event, args: TArgs) => {
    Logger.debug(`ipcMain on ${action}`, args);

    try {
      const result = listener(args, event);

      // Handle async listeners
      if (result instanceof Promise) {
        result
          .then(() => executePostActions(options))
          .catch(error => {
            const err = error as Error;
            Logger.logError(err);
            event.sender.send(action, createErrorResponse(action, error));
          });
      } else {
        executePostActions(options);
      }
    } catch (error) {
      Logger.logError(error as Error);
      event.sender.send(action, createErrorResponse(action, error));
    }
  });
}

/**
 * Creates an async IPC handler with explicit async support
 * Use this when the handler needs to perform async operations
 *
 * @param action - The IPC action/channel name
 * @param handler - The async handler function
 * @param options - Configuration options for post-action hooks
 */
export function createAsyncIPCHandler<
  TArgs = unknown,
  TResult = Record<string, unknown>,
>(
  action: string,
  handler: (
    args: TArgs,
    event: IpcMainInvokeEvent,
  ) => Promise<HandlerResult<TResult>>,
  options: IPCHandlerOptions = {},
): void {
  createIPCHandler<TArgs, TResult>(action, handler, options);
}

/**
 * Common post-action presets for quick configuration
 */
export const PostActionPresets = {
  /** Standard clip modification: mark dirty, send WS project, reload menu */
  clipModification: {
    markDirty: true,
    sendWSProject: true,
    reloadMenu: true,
  } as IPCHandlerOptions,

  /** Clip update that also notifies via WS clip update */
  clipUpdate: {
    markDirty: true,
    sendWSClipUpdate: true,
    reloadMenu: true,
  } as IPCHandlerOptions,

  /** Project-level changes: mark dirty, send WS project */
  projectChange: {
    markDirty: true,
    sendWSProject: true,
  } as IPCHandlerOptions,

  /** Read-only operation: no post-actions */
  readOnly: {} as IPCHandlerOptions,
} as const;
