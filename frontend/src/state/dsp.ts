/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  OfflineAnalysisSettings,
  PreprocessingSettings,
} from '../../../main/src/hapticsSdk';
import parameters from '../globals/AudioAnalyzerConfig.json';
import {AnalysisSettings, ParameterValues} from './types';

export interface DspSettings {
  offline: OfflineAnalysisSettings;
  preprocessing: PreprocessingSettings;
}

/**
 * Get the default DSP settings from the AudioAnalyzerConfi.json file
 * @returns the dsp settings as `ParameterValues`
 */
export function defaultDspSettings(): ParameterValues {
  return Object.keys(parameters.parameters).reduce(
    (obj: any, item: string) => ({
      ...obj,
      [item]: (parameters.parameters as AnalysisSettings)[item].default,
    }),
    {},
  );
}

/**
 * Pack the plain parameter values inside the `ParameterValues` as a structured `DspSettings` object
 * @param params the dps values
 * @returns the DspSettings object
 */
export function packDspSettings(params: ParameterValues): DspSettings {
  const settings: DspSettings = {
    preprocessing: {
      gain_db: params.gain_db ?? parameters.parameters.gain_db.default,
      normalize_audio: Boolean(
        params.normalize_audio ?? parameters.parameters.normalize_audio.default,
      ),
      normalize_level_db:
        params.normalize_level_db ??
        parameters.parameters.normalize_level_db.default,
    },
    offline: {
      amplitude_breakpoints_per_second:
        params.amplitude_breakpoints_per_second ??
        parameters.parameters.amplitude_breakpoints_per_second.default,
      minimum_breakpoint_score:
        params.minimum_breakpoint_score ??
        parameters.parameters.minimum_breakpoint_score.default,
      amplitude: {
        envelope_attack_time:
          (params.envelope_attack_time ??
            parameters.parameters.envelope_attack_time.default) / 1000,
        envelope_hold_time:
          (params.envelope_hold_time ??
            parameters.parameters.envelope_hold_time.default) / 1000,
        envelope_release_time:
          (params.envelope_release_time ??
            parameters.parameters.envelope_release_time.default) / 1000,
        time_between_updates:
          params.time_between_updates ??
          parameters.parameters.time_between_updates.default,
        rms_windowing_time:
          params.rms_windowing_time ??
          parameters.parameters.rms_windowing_time.default,
      },
      frequency_breakpoints_per_second:
        params.frequency_breakpoints_per_second ??
        parameters.parameters.frequency_breakpoints_per_second.default,
      frequency: {
        frequency_max:
          params.frequency_max ?? parameters.parameters.frequency_max.default,
        frequency_min:
          params.frequency_min ?? parameters.parameters.frequency_min.default,
        output_min:
          params.output_min ?? parameters.parameters.output_min.default,
        output_max:
          params.output_max ?? parameters.parameters.output_max.default,
      },
      emphasis_enabled: Boolean(
        params.emphasis_enabled ??
          parameters.parameters.emphasis_enabled.default,
      ),
      emphasis: {
        sensitivity_percent:
          params.sensitivity_percent ??
          parameters.parameters.sensitivity_percent.default,
        peak_window_ms:
          params.peak_window_ms ?? parameters.parameters.peak_window_ms.default,
        minimum_rise:
          params.minimum_rise ?? parameters.parameters.minimum_rise.default,
        plateau_factor_percent:
          params.plateau_factor_percent ??
          parameters.parameters.plateau_factor_percent.default,
        sharpness_min:
          (params.sharpness_min ??
            parameters.parameters.sharpness_min.default) / 100,
        sharpness_max:
          (params.sharpness_max ??
            parameters.parameters.sharpness_max.default) / 100,
        ducking_percent:
          params.ducking_percent ??
          parameters.parameters.ducking_percent.default,
      },
      spectrum: {
        centroid_lowpass_hz:
          params.centroid_lowpass_hz ??
          parameters.parameters.centroid_lowpass_hz.default,
        fft_size: params.fft_size ?? parameters.parameters.fft_size.default,
        overlap_factor:
          params.overlap_factor ?? parameters.parameters.overlap_factor.default,
      },
    },
  };
  return settings;
}

/**
 * Unpack the dsp settings from the DspSettings object and store them in a plain `ParameterValues` for the UI
 * @param settings the settings object
 * @returns the extracted values
 */
export function unpackDspSettings(settings: DspSettings): ParameterValues {
  return {
    gain_db: settings.preprocessing.gain_db,
    normalize_audio: Number(settings.preprocessing.normalize_audio),
    normalize_level_db: settings.preprocessing.normalize_level_db,
    minimum_breakpoint_score: settings.offline.minimum_breakpoint_score,
    amplitude_breakpoints_per_second:
      settings.offline.amplitude_breakpoints_per_second,
    envelope_attack_time:
      (settings.offline.amplitude?.envelope_attack_time ?? 0) * 1000,
    envelope_hold_time:
      (settings.offline.amplitude?.envelope_hold_time ?? 0) * 1000,
    envelope_release_time:
      (settings.offline.amplitude?.envelope_release_time ?? 0) * 1000,
    frequency_breakpoints_per_second:
      settings.offline.frequency_breakpoints_per_second,
    frequency_max: settings.offline.frequency?.frequency_max,
    frequency_min: settings.offline.frequency?.frequency_min,
    output_min: settings.offline.frequency?.output_min,
    output_max: settings.offline.frequency?.output_max,
    emphasis_enabled: Number(settings.offline.emphasis_enabled),
    sensitivity_percent: settings.offline.emphasis?.sensitivity_percent,
    peak_window_ms: settings.offline.emphasis?.peak_window_ms,
    minimum_rise: settings.offline.emphasis?.minimum_rise,
    plateau_factor_percent: settings.offline.emphasis?.plateau_factor_percent,
    sharpness_min: (settings.offline.emphasis?.sharpness_min ?? 0) * 100,
    sharpness_max: (settings.offline.emphasis?.sharpness_max ?? 0) * 100,
    ducking_percent: settings.offline.emphasis?.ducking_percent,
    centroid_lowpass_hz: settings.offline.spectrum?.centroid_lowpass_hz,
    fft_size: settings.offline.spectrum?.fft_size,
    overlap_factor: settings.offline.spectrum?.overlap_factor,
    time_between_updates: settings.offline.amplitude?.time_between_updates,
    rms_windowing_time: settings.offline.amplitude?.rms_windowing_time,
    sharpness: undefined,
    frequency: undefined,
    output: undefined,
  };
}
