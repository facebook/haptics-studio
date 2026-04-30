/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-await-in-loop */
import {WebContents} from 'electron';
import fs from 'fs';
import path from 'path';
import {isEmpty} from 'lodash';

import {AudioAnalysisFile} from '../listeners/clips';
import Project, {Clip, ClipInfo, OathSettings} from '../common/project';
import Logger from '../common/logger';
import {IPCMessage} from '../listeners';
import Configs from '../common/configs';
import {sanitizeEnvelopesDuration, verifyAudioFile} from '../common/utils';
import {
  executeOath,
  updateAmplitudeEnvelope,
  updateFrequencyEnvelope,
} from '../hapticsSdk';
import MainApplication from '../application';
import Analytics, {ErrorType} from '../analytics';

const handleAnalysisError = (
  sender: WebContents,
  action: string,
  clipId: string,
  error: Error,
  reason?: string,
) => {
  const {stack, name} = error;
  const errMessage = error.message;
  Analytics.instance.addErrorEvent({
    type: ErrorType.hapticsSdk,
    message: errMessage,
    error_name: name,
    stack_trace: stack ?? '',
  });
  Logger.error(`${errMessage}:`, stack);

  const response: IPCMessage<ClipInfo> = {
    action,
    status: 'error',
    message: errMessage,
    clipId,
    reason,
  };

  sender.send(action, response);
};

/**
 * Analyze multiple audio files
 * @param {webContents} sender - The window to respond to
 * @param {string} action - The action name
 * @param {AudioAnalysisFile[]} files - The list of files to analyze
 * @returns {Promise<void>}
 */
export async function analyzeFiles(
  sender: WebContents,
  action: string,
  files: AudioAnalysisFile[],
  silent: boolean,
): Promise<void> {
  const {sessionId} = Project.instance.getState();

  // Start iterating files
  for (let index = 0; index < files.length; index += 1) {
    // Break the loop if the user has closed the project while some files are still being analyzed
    if (!Project.instance.hasContent()) {
      Logger.warn('File analysis interrupted');
      break;
    }
    const message = files[index];
    const {path: audioPath, clipId, settings} = message;
    let payload: ClipInfo;
    let reason;
    const response: IPCMessage<ClipInfo> = {action, status: 'ok', payload: {}};

    try {
      // Get Audio file path from the UI
      const {projectFile} = Configs.instance.getCurrentProject();
      const clip: Clip | undefined = Project.instance.getClipById(clipId);
      let currentClipAudioFilePath =
        clip && clip.audioAsset ? clip.audioAsset.path : undefined;
      if (
        projectFile &&
        currentClipAudioFilePath &&
        !path.isAbsolute(currentClipAudioFilePath)
      ) {
        currentClipAudioFilePath = path.resolve(
          path.dirname(projectFile),
          currentClipAudioFilePath,
        );
      }
      const audioFilePath = currentClipAudioFilePath || audioPath;

      if (!fs.existsSync(audioFilePath)) {
        sender.send('missing_audio_file', {action, clipId, audioFilePath});
        reason = 'missing_audio_file';
        throw new Error(`Missing Audio File ${audioFilePath}`);
      }

      // Check if the audio file is valid and retrieve the number of channels
      const {channels} = await verifyAudioFile(audioFilePath);

      // When the analysis is silent wait for 1 second before sending the result to the UI
      const analysisTimeout = setTimeout(
        () => {
          // Send the clip that is going to be analyzed before running the dsp
          sender.send('current_analysis', {
            action: 'current_analysis',
            status: 'ok',
            payload: {clipId},
          });
        },
        silent ? 1000 : 0,
      );

      // Call the DSP
      const {waveform, result} = executeOath(audioFilePath, settings);

      const name =
        message.name ??
        path.basename(audioFilePath, path.extname(audioFilePath));

      sanitizeEnvelopesDuration(result.signals.continuous.envelopes);

      // Clear analysis timeout
      if (analysisTimeout) {
        clearTimeout(analysisTimeout);
      }

      payload = {
        clipId,
        sessionId,
        name,
        audio: {path: audioFilePath, exists: true, channels},
        svg: waveform,
        haptic: result,
        settings,
      };

      if (clip) {
        clip.haptic = result;
      }

      const clipInfo: ClipInfo = {
        clipId,
        sessionId,
        ...payload,
      };

      // Add clip to project file
      Project.instance.addOrUpdateClip(clipInfo);

      // Update project state
      if (isEmpty(Project.instance.getState()) && index === 0) {
        Project.instance.updateState(clipId, sessionId);
      }

      if (index === 0) {
        // Reload menu items only when at least the first analysis is completed
        // this enables the save buttons
        MainApplication.instance.reloadMenuItems();
      }

      response.payload = payload;

      sender.send(action, response);
    } catch (error) {
      handleAnalysisError(sender, action, clipId, error as Error, reason);
    }
  }
}

/**
 * Update the analysis of an existing clip
 * @param sender The window to respond to
 * @param action The action name
 * @param clipId The id of the clip to re-analyze
 * @param settings The updated OATH settings
 */
export async function updateAnalysis(
  sender: WebContents,
  action: string,
  clipId: string,
  settings: OathSettings,
  group: 'amplitude' | 'frequency',
): Promise<void> {
  const response: IPCMessage<ClipInfo> = {action, status: 'ok', payload: {}};
  let reason;

  try {
    // Get Audio file path from current clip
    const {projectFile} = Configs.instance.getCurrentProject();
    const clip: Clip | undefined = Project.instance.getClipById(clipId);
    if (!clip) {
      throw new Error(`Clip ${clipId} not found`);
    }

    let audioFilePath =
      clip && clip.audioAsset ? clip.audioAsset.path : undefined;
    if (projectFile && audioFilePath && !path.isAbsolute(audioFilePath)) {
      audioFilePath = path.resolve(path.dirname(projectFile), audioFilePath);
    }

    if (!audioFilePath || !fs.existsSync(audioFilePath)) {
      sender.send('missing_audio_file', {action, clipId, audioFilePath});
      reason = 'missing_audio_file';
      throw new Error(`Missing Audio File ${audioFilePath ?? ''}`);
    }

    // Check if the audio file is valid
    await verifyAudioFile(audioFilePath);

    const result = clip.haptic;
    if (!result) {
      throw new Error(`Missing Haptic Data for clip ${clip.name ?? ''}`);
    }

    // Call the DSP
    if (group === 'amplitude') {
      result.signals.continuous.envelopes.amplitude = updateAmplitudeEnvelope(
        audioFilePath,
        settings,
      );
    } else {
      result.signals.continuous.envelopes.frequency = updateFrequencyEnvelope(
        audioFilePath,
        settings,
      );
    }

    sanitizeEnvelopesDuration(result.signals.continuous.envelopes);

    const payload = {
      clipId,
      haptic: result,
      settings,
      group,
    };

    Logger.debug(`Updated clip ${action}`, payload.haptic);

    clip.haptic = result;

    // Add clip to project file
    Project.instance.addOrUpdateClip(payload);

    response.payload = payload;
    sender.send(action, response);
  } catch (error) {
    handleAnalysisError(sender, action, clipId, error as Error, reason);
  }
}
