/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Audio-related clip handlers
 */

import {dialog} from 'electron';
import {isEmpty, isNil} from 'lodash';
import path from 'path';
import {IpcInvokeChannel, IpcSendChannel} from '../../../../shared';
import {
  createIPCHandler,
  createIPCListener,
  PostActionPresets,
} from '../ipcHandlerUtils';

import Logger from '../../common/logger';
import Configs from '../../common/configs';
import Constants from '../../common/constants';
import MainApplication from '../../application';
import {PathManager} from '../../services';
import Project, {Clip, ClipInfo} from '../../common/project';
import {validateJsonString, getWaveform} from '../../hapticsSdk';
import WSServer from '../../wsServer';
// @oss-disable
import {getSplitChannels} from '../../common/utils';
import {analyzeFiles} from '../../actions/analysis';

import {
  StereoSplitMessage,
  HapticUpdateMessage,
  AudioAnalysisFile,
} from './types';

/**
 * Split a stereo clip into two mono clips
 */
export function splitStereoClip(): void {
  createIPCListener<StereoSplitMessage>(
    IpcSendChannel.SplitStereoClip,
    async (args, event) => {
      const {clipId, channels, settings} = args;

      const clip: Clip | undefined = Project.instance.getClipById(clipId);
      if (isNil(clip) || !clip.audioAsset) {
        return;
      }

      try {
        const audioChannels = await getSplitChannels(clip.audioAsset.path);
        const files: AudioAnalysisFile[] = [
          {
            clipId: channels[0].clipId,
            path: audioChannels.left,
            settings,
            name: channels[0].name,
          },
          {
            clipId: channels[1].clipId,
            path: audioChannels.right,
            settings,
            name: channels[1].name,
          },
        ];

        await analyzeFiles(event.sender, 'audio_analysis', files, true);

        Configs.instance.setCurrentProject({
          ...Configs.instance.getCurrentProject(),
          dirty: true,
        });

        // @oss-disable

        // Send Current project
        WSServer.instance.sendCurrentProject();
      } catch (e) {
        Logger.error((e as Error).message);
      }
    },
  );
}

/**
 * Saves settings and Haptic file
 */
export function hapticUpdate(): void {
  createIPCHandler<HapticUpdateMessage>(
    IpcInvokeChannel.HapticUpdate,
    args => {
      const {clipId, haptic} = args;
      const {sessionId} = Project.instance.getState();
      const projectName = Project.instance.getName();

      const clip: Clip | undefined = Project.instance.getClipById(clipId);
      if (isNil(clip)) {
        return {
          status: 'error',
          message: `Clip ${clipId} not found in project ${projectName}`,
        };
      }

      if (isNil(sessionId) || isNil(clipId)) {
        return {
          status: 'error',
          message: 'Missing info clipId or sessionId in IPC Message',
        };
      }

      // Skip validation if the clip is empty
      const skipValidation =
        haptic.signals.continuous.envelopes.amplitude.length < 2 ||
        (haptic.signals.continuous.envelopes.frequency?.length ?? 0) < 2;

      // Checks if the haptic data is valid
      const dataValid =
        skipValidation || validateJsonString(JSON.stringify(haptic));
      if (!dataValid) {
        Logger.warn('Data validation failed.');
        return {status: 'invalid', message: 'Data validation failed.'};
      }

      if (!Project.instance.hasContent()) {
        return {status: 'error', message: 'No current project loaded'};
      }

      // Add clip to project file, if already exists update the default variation
      const clipInfo: ClipInfo = {
        clipId,
        sessionId,
        name: clip.name,
        audio: clip.audioAsset,
        haptic,
      };
      Project.instance.addOrUpdateClip(clipInfo);

      return {status: 'ok'};
    },
    PostActionPresets.clipUpdate,
  );
}

/**
 * Relocates an asset for a specific clip
 */
export function relocateAsset(): void {
  createIPCHandler<{clipId: string}>(
    IpcInvokeChannel.RelocateAsset,
    args => {
      const {clipId} = args;
      const clip = Project.instance.getClipById(clipId);
      if (isNil(clip)) {
        throw new Error(`Clip with id ${clipId} not found`);
      }
      const window = MainApplication.instance.getMainWindow();
      if (isNil(window)) {
        return {};
      }

      const {audioAsset} = clip;
      let defaultPath = PathManager.instance.getHomePath();
      if (audioAsset && audioAsset.hapticPath) {
        defaultPath = path.dirname(audioAsset.hapticPath);
      } else if (audioAsset && audioAsset.path) {
        defaultPath = path.dirname(audioAsset.path);
      }

      const filePaths = dialog.showOpenDialogSync(window, {
        title: 'Relocate Asset',
        defaultPath,
        properties: ['openFile'],
        filters: [
          {
            name: 'Audio Files',
            extensions: Constants.PROJECT.SUPPORTED_AUDIO_EXTENSIONS.map(s =>
              s.replace('.', ''),
            ),
          },
        ],
        buttonLabel: 'Select',
      });
      if (!filePaths || isEmpty(filePaths)) {
        return {status: 'canceled'};
      }

      const [audioFilePath] = filePaths;
      clip.audioAsset = {
        path: audioFilePath,
      };
      Project.instance.updateClip(clipId, clip);

      return {
        payload: {
          clipId,
          audioAsset: {
            path: audioFilePath,
            name: clip.name,
            exists: true,
          },
        },
      };
    },
    PostActionPresets.clipModification,
  );
}

/**
 * Add audio to an existing clip
 */
export function addAudioToClip(): void {
  createIPCHandler<{clipId: string}>(
    IpcInvokeChannel.AddAudioToClip,
    args => {
      const {clipId} = args;
      const clip = Project.instance.getClipById(clipId);
      if (isNil(clip)) {
        throw new Error(`Clip with id ${clipId} not found`);
      }
      const window = MainApplication.instance.getMainWindow();
      if (isNil(window)) {
        return {};
      }

      const {audioAsset} = clip;
      let defaultPath = PathManager.instance.getHomePath();
      if (audioAsset && audioAsset.hapticPath) {
        defaultPath = path.dirname(audioAsset.hapticPath);
      }

      const filePaths = dialog.showOpenDialogSync(window, {
        title: 'Add Audio Asset',
        defaultPath,
        properties: ['openFile'],
        filters: [
          {
            name: 'Audio Files',
            extensions: Constants.PROJECT.SUPPORTED_AUDIO_EXTENSIONS.map(s =>
              s.replace('.', ''),
            ),
          },
        ],
        buttonLabel: 'Select',
      });
      if (!filePaths || isEmpty(filePaths)) {
        return {status: 'canceled'};
      }

      const [audioFilePath] = filePaths;
      clip.audioAsset = {
        path: audioFilePath,
      };
      const waveform = getWaveform(audioFilePath);
      clip.waveform = waveform;
      Project.instance.updateClip(clipId, clip);

      return {
        payload: {
          clipId,
          audioAsset: {
            path: audioFilePath,
            name: clip.name,
            exists: true,
          },
          waveform,
        },
      };
    },
    PostActionPresets.clipModification,
  );
}

/**
 * Bind audio-related IPC handlers
 */
export default function bindAudioHandlers(): void {
  splitStereoClip();
  hapticUpdate();
  relocateAsset();
  addAudioToClip();
}
