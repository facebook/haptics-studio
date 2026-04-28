/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/no-empty-function */
export default {
  offline: {
    spectrum: {fft_size: 1024, overlap_factor: 8, centroid_lowpass_hz: 1000},
    amplitude: {
      time_between_updates: 0.001,
      envelope_attack_time: 0.0001,
      envelope_hold_time: 0.0015,
      envelope_release_time: 0.1,
      rms_windowing_time: 0.0001,
    },
    amplitude_breakpoints_per_second: 60,
    frequency: {
      frequency_min: 30,
      frequency_max: 600,
      output_min: 0,
      output_max: 1,
    },
    frequency_breakpoints_per_second: 60,
    emphasis_enabled: true,
    emphasis: {
      sensitivity_percent: 50,
      peak_window_ms: 100,
      minimum_rise: 0.1,
      plateau_factor_percent: 25,
      sharpness_min: 0,
      sharpness_max: 1,
      ducking_percent: 50,
    },
    minimum_breakpoint_score: 1e-8,
  },
  preprocessing: {gain_db: 0, normalize_audio: false, normalize_level_db: 0},
};
