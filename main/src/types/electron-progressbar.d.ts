/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

declare module 'electron-progressbar' {

  import { BrowserWindowConstructorOptions, app } from 'electron';

  declare class ProgressBar {
    constructor(options: ProgressBarOptions, electronApp?: typeof app)

    getOptions(): ProgressBarOptions;

    on(eventName: 'ready' | 'progress' | 'completed' | 'aborted', listener: () => void): this;

    setCompleted(): void;

    close(): void;

    isInProgress(): boolean;

    isCompleted(): boolean;

    value: number;

    text: string;

    detail: string;
  }

  interface ProgressBarOptions {
    abortOnError?: boolean | undefined;
    indeterminate?: boolean | undefined;
    initialValue?: number | undefined;
    maxValue?: number | undefined;
    closeOnComplete?: boolean | undefined;
    title?: string | undefined;
    text?: string | undefined;
    detail?: string | undefined;
    style?: StyleOptions | undefined;
    browserWindow?: BrowserWindowConstructorOptions | undefined;
  }

  interface StyleOptions {
    text?: Record<string, unknown> | undefined;
    detail?: Record<string, unknown> | undefined;
    bar?: Record<string, unknown> | undefined;
    value?: Record<string, unknown> | undefined;
  }

  export default ProgressBar;
}
