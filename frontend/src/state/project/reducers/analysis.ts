/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';
import {v4 as uuidv4} from 'uuid';
import {webUtils} from 'electron';

import type {PayloadAction} from '@reduxjs/toolkit';
import {timelineFor} from '../../../globals/utils';
import {defaultDspSettings, DspSettings, unpackDspSettings} from '../../dsp';
import {
  AnalysisRequest,
  Audio,
  AudioEnvelope,
  Clip,
  ClipGroup,
  ClipState,
  ParameterValues,
} from '../../types';
import {UndoHistorySize} from '../../../globals/constants';
import {HapticData} from '../../../../../main/src/hapticsSdk';
import {ProjectState} from '../types';
import {prepareClipsForAnalysis} from './helpers';

export const analysisReducers = {
  /**
   * Perform the audio analysis on an existing audio with new parameters
   * @param action.clipId the clip id to re-analyze
   * @param action.settings the settings values
   */
  retryAudioAnalysis(
    _state: ProjectState,
    _action: PayloadAction<{clipId: string; settings: ParameterValues}>,
  ) {},

  /**
   * Perform the audio analysis on an existing audio with new parameters
   * @param action.clipId the clip id to analyze
   * @param action.settingsChange a selection of settings values tweaked by the UI
   */
  updateAudioAnalysis(
    _state: ProjectState,
    _action: PayloadAction<{
      clipId: string;
      settingsChange: {[key: string]: number};
      group: string;
    }>,
  ) {},

  /**
   * Analyze multiple clips with a single set of parameters
   * @param action.clipIds the clip ids to analyze
   * @param action.settings the settings values tweaked by the UI
   */
  batchAudioAnalysis(
    _state: ProjectState,
    _action: PayloadAction<{
      clipIds: string[];
      settingsChange: {[key: string]: number};
      group: string;
    }>,
  ) {},

  /**
   * Start the async file analysis
   * @param action.silent if true, the message triggering the loading spinner is deferred
   * @param action.data the analysis request object
   * @param action.settings the settings values tweaked by the UI
   */
  analyzeFiles: {
    reducer(
      state: ProjectState,
      action: PayloadAction<{
        silent: boolean;
        data: AnalysisRequest;
        settings: ParameterValues;
      }>,
    ) {
      const folders: Record<string, string[]> = {};
      const {data} = action.payload;
      Object.keys(data).forEach(k => {
        const pathComponents: string[] = data[k].path.split(path.sep);
        let root = 'root';
        if (pathComponents.length > 2) {
          root = pathComponents[pathComponents.length - 2];
        }
        if (folders[root]) {
          folders[root].push(k);
        } else {
          folders[root] = [k];
        }
      });

      let groups: ClipGroup[] = [];
      if (Object.keys(folders).length === 1) {
        groups = Object.keys(data).map(k => {
          return {
            id: uuidv4(),
            isFolder: false,
            name: undefined,
            clips: [k],
          };
        });
      } else {
        groups = Object.keys(folders).map(k => {
          return {
            id: uuidv4(),
            isFolder: true,
            name: k,
            clips: folders[k],
          };
        });
      }

      const currentClip = Object.keys(data)[0];
      return {
        ...state,
        clips: prepareClipsForAnalysis(state, action.payload.data),
        loading: false,
        groups: [...state.groups, ...groups],
        selection: {
          clips: [currentClip],
          groups: [],
          lastSelected: currentClip,
        },
        currentClipId: currentClip,
      };
    },
    prepare: (params: {files: File[]; settings: ParameterValues}) => {
      const data: AnalysisRequest = {};
      params.files.forEach((f: File) => {
        let filePath;
        if (process.env.NODE_ENV === 'test') {
          filePath = (f as any).path ?? f.name;
        } else {
          try {
            filePath = webUtils.getPathForFile(f);
          } catch {
            filePath = (f as any).path;
          }
        }
        data[uuidv4()] = {
          path: filePath,
        };
      });

      return {
        payload: {
          data,
          settings: params.settings,
          silent: false,
        },
      };
    },
  },

  /**
   * Split a stereo audio file to 2 mono audio files
   * @param action.clipId the clip id to split
   */
  splitStereoAudio: {
    reducer(
      state: ProjectState,
      action: PayloadAction<{
        clipId: string;
        leftId: string;
        rightId: string;
      }>,
    ) {
      const originalClip = state.clips[action.payload.clipId];
      if (!originalClip.audio) return;
      const audio = {...originalClip.audio, channels: 1};

      const channelClip = (prefix: string): Clip => ({
        name: `${originalClip.name}_${prefix}`,
        loading: false,
        failed: false,
        error: undefined,
        audio,
        hasChanges: {
          amplitude: false,
          frequency: false,
        },
        svg: undefined,
        timeline: undefined,
        playhead: 0,
        markers: [],
        trimAt: undefined,
        state: {
          present: {
            revision: 0,
            haptic: undefined,
            dsp: originalClip.state.present.dsp,
            selectedPoints: [],
            selectedEmphasis: undefined,
          },
          past: [],
          future: [],
        },
      });

      state.clips[action.payload.leftId] = channelClip('L');
      state.clips[action.payload.rightId] = channelClip('R');

      const originalGroup = state.groups.find(g =>
        g.clips.includes(action.payload.clipId),
      );
      if (originalGroup) {
        if (originalGroup.isFolder) {
          const originalIndex = originalGroup.clips.indexOf(
            action.payload.clipId,
          );
          originalGroup.clips.splice(
            originalIndex + 1,
            0,
            action.payload.leftId,
            action.payload.rightId,
          );
        } else {
          const groupIndex = state.groups.findIndex(
            g => g.id === originalGroup.id,
          );
          state.groups.splice(
            groupIndex + 1,
            0,
            {
              id: uuidv4(),
              name: '',
              clips: [action.payload.leftId],
              isFolder: false,
            },
            {
              id: uuidv4(),
              name: '',
              clips: [action.payload.rightId],
              isFolder: false,
            },
          );
        }
      }
    },
    prepare: (params: {clipId: string}) => {
      return {
        payload: {
          clipId: params.clipId,
          leftId: uuidv4(),
          rightId: uuidv4(),
        },
      };
    },
  },

  /**
   * Set the analysis results
   * @param action.clipId the clip id analyzed
   * @param action.settings the settings values used in the analysis
   * @param action.svg the audio waveform
   * @param action.haptic the haptic data
   */
  analysisSuccess(
    state: ProjectState,
    action: PayloadAction<{
      clipId: string;
      name: string;
      settings: DspSettings;
      svg: AudioEnvelope;
      haptic: HapticData;
      audio: Audio;
    }>,
  ) {
    const {clipId, name, settings, svg, haptic, audio} = action.payload;
    const past: ClipState[] = state.clips[clipId].state.present.haptic
      ? [...state.clips[clipId].state.past, state.clips[clipId].state.present]
      : [];
    return {
      ...state,
      clips: {
        ...state.clips,
        [clipId]: {
          ...state.clips[clipId],
          name,
          audio,
          hasChanges: {
            amplitude: false,
            frequency: false,
          },
          loading: false,
          svg,
          timeline:
            past.length > 0
              ? state.clips[clipId].timeline
              : timelineFor(haptic),
          playhead: 0,
          state: {
            present: {
              revision: state.clips[clipId].state.present.revision + 1,
              dsp: settings
                ? unpackDspSettings(settings)
                : defaultDspSettings(),
              haptic,
              selectedPoints: [],
              selectedEmphasis: undefined,
            },
            past: past.length > UndoHistorySize ? past.slice(1) : past,
            future: [],
          },
        },
      },
    };
  },

  /**
   * Set the analysis results
   * @param action.clipId the clip id that was analyzed
   * @param action.settings the settings values used in the analysis
   * @param action.svg the audio waveform
   * @param action.haptic the haptic data
   */
  analysisUpdateSuccess(
    state: ProjectState,
    action: PayloadAction<{
      clipId: string;
      settings: DspSettings;
      haptic: HapticData;
      group: 'amplitude' | 'frequency';
    }>,
  ) {
    const {clipId, settings, haptic} = action.payload;

    const past: ClipState[] = state.clips[clipId].state.present.haptic
      ? [...state.clips[clipId].state.past, state.clips[clipId].state.present]
      : [];

    state.clips[clipId].hasChanges[action.payload.group] = false;
    state.clips[clipId].loading = false;
    state.clips[clipId].state.present.haptic = haptic;
    state.clips[clipId].state.present.dsp = settings
      ? unpackDspSettings(settings)
      : defaultDspSettings();
    state.clips[clipId].state.present.revision += 1;
    state.clips[clipId].state.present.selectedPoints = [];
    state.clips[clipId].state.past =
      past.length > UndoHistorySize ? past.slice(1) : past;
    state.clips[clipId].state.future = [];
  },

  /**
   * Set the analysis failure state
   * @param action.clipId the clip id analyzed
   * @param action.error the error message
   */
  analysisFailure(
    state: ProjectState,
    action: PayloadAction<{clipId: string; error: string}>,
  ) {
    const clip =
      state.clips[action.payload.clipId ?? state.currentClipId ?? ''];
    if (!clip) return;

    clip.loading = false;
    clip.failed = true;
    clip.error = action.payload.error;
  },
};
