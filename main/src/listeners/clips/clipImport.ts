/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Import-related clip handlers
 */

import path from 'path';
import fs from 'fs';
import {IpcSendChannel} from '../../../../shared';
import {createIPCListener} from '../ipcHandlerUtils';
import {HapticData} from '../../hapticsSdk';

import Logger from '../../common/logger';
import Configs from '../../common/configs';
import Constants from '../../common/constants';
import MainApplication from '../../application';
import Project, {Clip} from '../../common/project';
import {IPCMessage} from '../index';
import {ClipPayload} from '../../actions/project';
import {validateJsonString} from '../../hapticsSdk';
import WSServer from '../../wsServer';
// @oss-disable
import {createEmptyHaptic} from '../../common/utils';
import {analyzeFiles, updateAnalysis} from '../../actions/analysis';

import {
  AudioAnalysisMessage,
  AudioAnalysisFile,
  RetryAudioAnalysisMessage,
  AudioAnalysisUpdateMessage,
  ImportHapticMessage,
} from './types';

/**
 * Performs analysis on the audio files
 */
export function audioAnalysis(): void {
  createIPCListener<AudioAnalysisMessage>(
    IpcSendChannel.AudioAnalysis,
    async (args, event) => {
      const {silent = false, files = []} = args;

      // Create project file if there is no current project loaded
      if (!Project.instance.hasContent()) {
        Project.instance.create(Constants.DEFAULT_PROJECT_NAME);
        // @oss-disable
        // @oss-disable
          // @oss-disable
        // @oss-disable
      }

      try {
        await analyzeFiles(event.sender, 'audio_analysis', files, silent);

        // set current project dir
        Configs.instance.setCurrentProject({
          ...Configs.instance.getCurrentProject(),
          tmpProjectFile: Project.instance.getProjectFile(),
          dirty: true,
          name: Project.instance.getName(),
        });
        // @oss-disable
        // @oss-disable
          // @oss-disable
          // @oss-disable
        // @oss-disable

        // send project info to the UI
        event.sender.send('project_info', {
          action: 'audio_analysis',
          status: 'ok',
          payload: {
            name: Project.instance.getName(),
            isSampleProject: Project.isSampleProject(),
            isTutorial: Project.instance.isTutorial(),
            isAuthoringTutorial: Project.instance.isAuthoringTutorial(),
          },
        });

        // Send Current project
        WSServer.instance.sendCurrentProject();
      } catch (e) {
        Logger.error((e as Error).message);
      }
    },
  );
}

/**
 * Retry audio analysis for a specific clip
 */
export function retryAudioAnalysis(): void {
  createIPCListener<RetryAudioAnalysisMessage>(
    IpcSendChannel.RetryAudioAnalysis,
    async (args, event) => {
      const {clipId, settings} = args;
      const clip: Clip | undefined = Project.instance.getClipById(clipId);
      if (!clip || !clip.audioAsset || !clip.audioAsset.path) return;

      const files: AudioAnalysisFile[] = [
        {
          clipId: clip.clipId,
          path: clip.audioAsset.path,
          settings,
        },
      ];

      try {
        await analyzeFiles(event.sender, 'audio_analysis', files, true);
        // Send Current project
        WSServer.instance.sendCurrentProject();
      } catch (e) {
        Logger.error((e as Error).message);
      }
    },
  );
}

/**
 * Update audio analysis for a specific clip
 */
export function updateAudioAnalysis(): void {
  createIPCListener<AudioAnalysisUpdateMessage>(
    IpcSendChannel.UpdateAudioAnalysis,
    async (args, event) => {
      const {clipId, settings, group} = args;

      try {
        await updateAnalysis(
          event.sender,
          'update_audio_analysis',
          clipId,
          settings,
          group,
        );
        // Send Current project
        WSServer.instance.sendCurrentProject();
      } catch (e) {
        Logger.error((e as Error).message);
      }
    },
  );
}

/**
 * Create clips in the current project from haptic files
 */
export function importHaptics(): void {
  createIPCListener<{files: ImportHapticMessage[]}>(
    IpcSendChannel.ImportHaptics,
    (args, event) => {
      const {files = []} = args;
      // We are responding with the 'audio_analysis' action because the UI is listening for this action
      const responseAction = 'audio_analysis';

      let projectChanged = false;

      // Create project file if there is no current project loaded
      if (!Project.instance.hasContent()) {
        Project.instance.create(Constants.DEFAULT_PROJECT_NAME);
        // @oss-disable
        // @oss-disable
          // @oss-disable
        // @oss-disable

        projectChanged = true;
      }

      const {sessionId} = Project.instance.getState();

      for (const file of files) {
        const {clipId, path: hapticPath} = file;
        const hapticData = fs.readFileSync(hapticPath, {encoding: 'utf-8'});

        if (validateJsonString(hapticData)) {
          const haptic = JSON.parse(hapticData) as HapticData;
          const filename = path.basename(hapticPath);
          const extension = path.extname(filename);

          Project.instance.addOrUpdateClip({
            clipId,
            name: filename.replace(extension, ''),
            audio: {
              hapticPath,
              exists: false,
            },
            svg: undefined,
            settings: undefined,
            haptic,
          });

          const response: IPCMessage<ClipPayload> = {
            action: responseAction,
            status: 'ok',
            payload: {
              name: filename.replace(extension, ''),
              audio: {hapticPath, path: undefined, exists: false},
              svg: undefined,
              haptic,
              settings: undefined,
              clipId,
              sessionId,
              markers: [],
              notes: '',
              lastUpdate: Date.now(),
            },
          };

          event.sender.send(responseAction, response);

          projectChanged = true;
        } else {
          // Send a response error for the current clipId, this will delete the clip from the UI
          event.sender.send('import_haptics', {
            action: 'import_haptics',
            status: 'error',
            payload: {clipId},
          });

          // Send an error message to show the snackbar
          // We cannot use event.sender.send here because using the 'error' channel will cause an error
          MainApplication.instance.sendToUI('error', {
            action: 'import_haptics',
            status: 'error',
            message: `${hapticPath} is not a valid haptic file.`,
          });
        }
      }

      // If we didn't change the project (no new clips or no new project created), cancel the action
      if (!projectChanged) {
        event.sender.send('import_haptics', {
          action: 'import_haptics',
          status: 'canceled',
          payload: {},
        });
        return;
      }

      // Set current project dir
      Configs.instance.setCurrentProject({
        ...Configs.instance.getCurrentProject(),
        tmpProjectFile: Project.instance.getProjectFile(),
        dirty: true,
        name: Project.instance.getName(),
      });

      // Send project info to the UI
      event.sender.send('project_info', {
        action: 'import_haptics',
        status: 'ok',
        payload: {
          name: Project.instance.getName(),
          isTutorial: Project.instance.isTutorial(),
          isAuthoringTutorial: Project.instance.isAuthoringTutorial(),
        },
      });
      // @oss-disable
      // @oss-disable
        // @oss-disable
        // @oss-disable
      // @oss-disable

      // Send Current project
      WSServer.instance.sendCurrentProject();

      MainApplication.instance.reloadMenuItems();
    },
  );
}

/**
 * Create an empty clip
 */
export function createEmptyClip(): void {
  createIPCListener<ImportHapticMessage>(
    IpcSendChannel.CreateEmptyClip,
    (args, event) => {
      const {clipId, name} = args;
      const responseAction = 'audio_analysis';

      // Create project file if there is no current project loaded
      if (!Project.instance.hasContent()) {
        Project.instance.create(Constants.DEFAULT_PROJECT_NAME);
        // @oss-disable
        // @oss-disable
          // @oss-disable
        // @oss-disable
      }

      const {sessionId} = Project.instance.getState();

      const haptic = createEmptyHaptic();

      Project.instance.addOrUpdateClip({
        clipId,
        name,
        audio: undefined,
        svg: undefined,
        settings: undefined,
        haptic,
      });

      const response: IPCMessage<ClipPayload> = {
        action: responseAction,
        status: 'ok',
        payload: {
          clipId,
          name,
          audio: undefined,
          svg: undefined,
          haptic,
          settings: undefined,
          sessionId,
          markers: [],
          notes: '',
          lastUpdate: Date.now(),
        },
      };

      event.sender.send(responseAction, response);

      // Set current project dir
      Configs.instance.setCurrentProject({
        ...Configs.instance.getCurrentProject(),
        tmpProjectFile: Project.instance.getProjectFile(),
        dirty: true,
        name: Project.instance.getName(),
      });
      // @oss-disable
      // @oss-disable
        // @oss-disable
        // @oss-disable
      // @oss-disable

      // Send project info to the UI
      event.sender.send('project_info', {
        action: 'create_empty_clip',
        status: 'ok',
        payload: {
          name: Project.instance.getName(),
          isTutorial: false,
          isAuthoringTutorial: false,
        },
      });

      // Send Current project
      WSServer.instance.sendCurrentProject();

      MainApplication.instance.reloadMenuItems();
    },
  );
}

/**
 * Bind import-related IPC handlers
 */
export default function bindImportHandlers(): void {
  audioAnalysis();
  retryAudioAnalysis();
  updateAudioAnalysis();
  importHaptics();
  createEmptyClip();
}
