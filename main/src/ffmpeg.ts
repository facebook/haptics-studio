/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {FFmpeg, createFFmpeg} from '@ffmpeg/ffmpeg';
import path from 'path';

import Logger from './common/logger';
import Configs from './common/configs';
import {PathManager} from './services';

const singletonEnforcer = Symbol('singletonEnforcer');

export default class FFmpegHelper {
  private static singleton: FFmpegHelper;

  private ffmpeg: FFmpeg | undefined;

  constructor(enforcer: symbol) {
    if (enforcer !== singletonEnforcer) {
      throw new Error('Cannot construct singleton');
    }
  }

  static get instance(): FFmpegHelper {
    if (!FFmpegHelper.singleton) {
      FFmpegHelper.singleton = new FFmpegHelper(singletonEnforcer);
    }
    return FFmpegHelper.singleton;
  }

  public async getFFmpeg(): Promise<FFmpeg> {
    if (!this.ffmpeg) {
      this.ffmpeg = FFmpegHelper.createFFmpeg();
    }
    if (!this.ffmpeg.isLoaded()) {
      await this.ffmpeg.load();
    }
    return this.ffmpeg;
  }

  private static getFFmpegPath(): string {
    const {app} = Configs.configs;
    if (app.env === 'development') {
      return path.join(
        PathManager.instance.getDistPath(),
        'dist',
        'ffmpeg-core',
      );
    }
    return path.join(PathManager.instance.getResourcesPath(), 'ffmpeg-core');
  }

  private static createFFmpeg(): FFmpeg {
    const {app} = Configs.configs;
    const ffmpegWasmPath = FFmpegHelper.getFFmpegPath();

    return createFFmpeg({
      log: app.env === 'development',
      logger: (logParams: {type: string; message: string}) => {
        Logger.debug(logParams.message);
      },
      corePath: path.join(ffmpegWasmPath, 'ffmpeg-core.js'),
      wasmPath: path.join(ffmpegWasmPath, 'ffmpeg-core.wasm'),
      workerPath: path.join(ffmpegWasmPath, 'ffmpeg-core.worker.js'),
    });
  }
}
