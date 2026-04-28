/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Media/audio utility functions
 */
import fs from 'fs';
import path from 'path';
import {promisify} from 'util';
import * as mm from 'music-metadata';
import mime from 'mime';
import {FFmpeg, fetchFile} from '@ffmpeg/ffmpeg';
import FFmpegHelper from '../../ffmpeg';
import Constants from '../constants';

export interface MediaMetadata {
  duration: number;
  channels: number;
}

/**
 * Get the audio file's metadata
 * @param filePath - path to the audio file
 * @returns metadata object with duration and number of channels
 */
export async function getMediaMetadata(
  filePath?: string,
): Promise<MediaMetadata> {
  if (!filePath) return Promise.reject(new Error('No file path provided'));
  const {format} = await mm.parseFile(filePath, {
    duration: true,
    skipCovers: true,
    skipPostHeaders: true,
  });
  return {
    duration: format.duration || 0,
    channels: format.numberOfChannels || 0,
  };
}

/**
 * Verify an audio file meets requirements
 * @param filePath - Path to the audio file
 * @returns MediaMetadata if valid
 * @throws Error if file is invalid
 */
export async function verifyAudioFile(
  filePath: string,
): Promise<MediaMetadata> {
  // Check audio file duration limit
  const {MAX_AUDIO_DURATION, MAX_UPLOAD_SIZE} = Constants;
  const metadata = await getMediaMetadata(filePath);
  if (metadata.duration === 0) {
    throw new Error('Cannot get duration from audio clip.');
  }
  if (metadata.duration > MAX_AUDIO_DURATION) {
    throw new Error(
      `Audio clip too long. Max allowed duration is ${MAX_AUDIO_DURATION} seconds`,
    );
  }
  // Check file size limit
  const stat = promisify(fs.stat);
  const fileStats = await stat(filePath);
  const {size} = fileStats;
  if (size > MAX_UPLOAD_SIZE) {
    throw new Error('Audio file size limit exceeded.');
  }
  return metadata;
}

/**
 * Get the MIME type of a file
 * @param filePath - Path to the file
 * @returns The MIME type string
 */
export function getFileMimeType(filePath?: string): string {
  if (!filePath) return '';
  if (!fs.existsSync(filePath)) return 'missing';
  try {
    return mime.getType(filePath) ?? 'unknown';
  } catch {
    return 'missing';
  }
}

/**
 * Split a stereo audio file into left and right channels
 * @param assetPath - Path to the audio file
 * @returns Paths to the left and right channel files
 */
export async function getSplitChannels(
  assetPath?: string,
): Promise<{left: string; right: string}> {
  if (!assetPath) return Promise.reject(new Error('No file path provided'));
  const {name, ext} = path.parse(assetPath);
  const leftPath = path.join(path.dirname(assetPath), `${name}_L${ext}`);
  const rightPath = path.join(path.dirname(assetPath), `${name}_R${ext}`);
  const file = await fetchFile(assetPath);

  const ffmpeg: FFmpeg = await FFmpegHelper.instance.getFFmpeg();
  ffmpeg.FS('writeFile', 'audio', file);
  await ffmpeg.run(
    '-i',
    'audio',
    '-filter_complex',
    '[0:a]channelsplit=channel_layout=stereo[left][right]',
    '-map',
    '[left]',
    `left.${ext}`,
    '-map',
    '[right]',
    `right.${ext}`,
  );
  fs.writeFileSync(leftPath, ffmpeg.FS('readFile', `left.${ext}`));
  fs.writeFileSync(rightPath, ffmpeg.FS('readFile', `right.${ext}`));
  ffmpeg.FS('unlink', 'audio');
  ffmpeg.FS('unlink', `left.${ext}`);
  ffmpeg.FS('unlink', `right.${ext}`);
  return Promise.resolve({left: leftPath, right: rightPath});
}
