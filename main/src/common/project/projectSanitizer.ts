/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Project Sanitizer - Migration and sanitization logic for project files
 *
 * Handles upgrading old project formats to current version.
 */

import {get, has, isEmpty, isNil, unset} from 'lodash';
import {v4 as uuidv4} from 'uuid';
import {TimeAmplitude} from '../../hapticsSdk';
import Configs from '../configs';
import Logger from '../logger';
import {getMediaMetadata, semVerFromObject, now} from '../utils';
import {Clip, OathSettings, ProjectContent} from './types';

/**
 * Check if the project version is compatible with the current app
 */
export const isProjectVersionCompatible = (
  content: ProjectContent | undefined,
): boolean => {
  if (!content) return false;
  return content.version.major <= Configs.instance.getAppVersion().major;
};

/**
 * Check if settings need to be remapped from old format
 * Old format lacks 'offline' and 'preprocessing' keys
 */
export const needsSettingsRemapping = (settings: OathSettings): boolean => {
  return !(has(settings, 'offline') && has(settings, 'preprocessing'));
};

/**
 * Parse and convert old settings format to current format
 * Maps legacy field names (pre-normalize-enable, env-pointsPerSecond, etc.)
 * to the new OathSettings structure
 */
export const parseSettings = (
  settings: Record<string, unknown>,
): OathSettings => {
  return {
    preprocessing: {
      gain_db: settings.gain_db as number,
      normalize_audio: settings['pre-normalize-enable'] === 1,
      normalize_level_db: settings['pre-normalize-value'] as number,
    },
    offline: {
      amplitude_breakpoints_per_second: settings[
        'env-pointsPerSecond'
      ] as number,
      spectrum: {
        fft_size: 1024,
        overlap_factor: 8,
        centroid_lowpass_hz: 1000,
      }, // DEFAULT
      minimum_breakpoint_score: 1e-8, // DEFAULT
      amplitude: {
        time_between_updates: 0.001, // DEFAULT
        rms_windowing_time: 0.0001, // DEFAULT
        envelope_attack_time: (settings['env-attack'] as number) / 1000,
        envelope_hold_time: (settings['env-hold'] as number) / 1000,
        envelope_release_time: (settings['env-release'] as number) / 1000,
      },
      frequency_breakpoints_per_second: settings[
        'centroid-pointsPerSecond'
      ] as number,
      frequency: {
        frequency_min: settings['centroid-scale-in-min'] as number,
        frequency_max: settings['centroid-scale-in-max'] as number,
        output_min: settings['centroid-scale-out-min'] as number,
        output_max: settings['centroid-scale-out-max'] as number,
      },
      emphasis_enabled: settings.emphasis_enabled === 1,
      emphasis: {
        sensitivity_percent: settings.emphasis_sensitivity_percent as number,
        peak_window_ms: settings.emphasis_peak_window_ms as number,
        minimum_rise: settings.emphasis_minimum_rise as number,
        plateau_factor_percent:
          settings.emphasis_plateau_factor_percent as number,
        sharpness_min:
          (settings.emphasis_frequency_min_percent as number) / 100,
        sharpness_max:
          (settings.emphasis_frequency_max_percent as number) / 100,
        ducking_percent: settings.emphasis_ducking_percent as number,
      },
    },
  };
};

/**
 * Sanitize a single clip for version 1.2.0 compatibility
 */
const sanitizeClipFor120 = (
  clip: Clip,
  content: ProjectContent,
  lastOpenedHapticId: string | undefined,
): boolean => {
  let modified = false;
  const {waveform, settings, lastUpdate} = clip;

  // Sanitize the svg envelope (older projects created with the Python DSP)
  const envelope = waveform
    ? (waveform as any as Record<string, unknown>).Envelope
    : undefined;
  if (envelope) {
    waveform.envelope = envelope as TimeAmplitude[];
    delete (waveform as any as Record<string, unknown>).Envelope;
    modified = true;
  }

  // Make sure that the clip has a valid settings object
  if (!isEmpty(settings) && needsSettingsRemapping(settings)) {
    clip.settings = parseSettings(settings as any as Record<string, unknown>);
    Logger.debug(`remapping settings for clip ${clip.name}`, clip.settings);
  }

  // Ensure that the lastUpdate is set
  if (isNil(lastUpdate)) {
    clip.lastUpdate = Date.now();
    modified = true;
  }

  // Removes the legacy references to `hapticId`
  const hapticId = get(clip, 'hapticId', undefined) as string | undefined;
  if (hapticId) {
    if (lastOpenedHapticId && hapticId === lastOpenedHapticId) {
      content.state.clipId = clip.clipId;
      unset(content.state, 'lastOpenedHapticId');
    }
    unset(clip, 'hapticId');
    modified = true;
  }

  // Adds support for projects created before the multiclip feature
  if (isNil(clip.clipId)) {
    clip.clipId = uuidv4();
    modified = true;
  }

  return modified;
};

/**
 * Sanitize a single clip for version 1.3.0 compatibility
 */
const sanitizeClipFor130 = async (clip: Clip): Promise<boolean> => {
  // Add number of channels to the audio clips
  if (clip.audioAsset && clip.audioAsset.channels === undefined) {
    const metadata = await getMediaMetadata(clip.audioAsset.path).catch(() => {
      return undefined;
    });
    clip.audioAsset.channels = metadata?.channels || 1;
    return true;
  }
  return false;
};

/**
 * Sanitize a single clip for version 2.0.0 compatibility
 */
const sanitizeClipFor200 = (clip: Clip): boolean => {
  // Move the haptic data from the variations array
  /* eslint-disable @typescript-eslint/no-unsafe-member-access */
  if (
    (clip as any).variations &&
    (clip as any).variations.length &&
    (clip as any).variations.length > 0 &&
    (clip as any).variations[0].vij
  ) {
    clip.haptic = (clip as any).variations[0].vij;
    delete (clip as any).variations;
    return true;
  }
  /* eslint-enable @typescript-eslint/no-unsafe-member-access */
  return false;
};

/**
 * Update the project file with the latest format
 * Returns true if the content was modified
 */
export const sanitizeProject = async (
  content: ProjectContent | undefined,
): Promise<boolean> => {
  if (!content) return false;

  let modified = false;
  const {clips = [], groups} = content;

  // Get the legacy reference to the HapticId, if any
  const lastOpenedHapticId = get(
    content.state,
    'lastOpenedHapticId',
    undefined,
  ) as string | undefined;

  const projectSemVer = semVerFromObject(content.version);

  /* eslint-disable no-restricted-syntax */
  // Version 1.2.0 migrations
  if (projectSemVer.compare('1.2.0') < 0) {
    Logger.debug('Updating project to 1.2.0 specs');
    for (const clip of clips) {
      if (sanitizeClipFor120(clip, content, lastOpenedHapticId)) {
        modified = true;
      }
    }

    // Adds support for projects created before the groups feature
    if (isNil(groups)) {
      content.groups = [];
      modified = true;
    }
  }

  // Version 1.3.0 migrations
  if (projectSemVer.compare('1.3.0') < 0) {
    Logger.debug('Updating project to 1.3.0 specs');
    for (const clip of clips) {
      // eslint-disable-next-line no-await-in-loop
      if (await sanitizeClipFor130(clip)) {
        modified = true;
      }
    }
  }

  // Version 2.0.0 migrations
  if (projectSemVer.compare('2.0.0') < 0) {
    Logger.debug('Updating project to 2.0.0 specs');
    for (const clip of clips) {
      if (sanitizeClipFor200(clip)) {
        modified = true;
      }
    }
  }
  /* eslint-enable no-restricted-syntax */

  // Update version and timestamp if modified
  if (modified) {
    content.version = Configs.instance.getAppVersion();
    content.updatedAt = now('nano');
  }

  return modified;
};
