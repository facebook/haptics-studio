/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {PayloadAction} from '@reduxjs/toolkit';
import {frequencyForSharpness} from '../../../globals/utils';
import {EmphasisType} from '../../types';
import {ProjectState} from '../types';
import {withAmplitudeEdit} from './helpers';

export const emphasisReducers = {
  /**
   * Set a custom amplitude on the emphasis points currently selected
   * @param action.clipId the clip id
   * @param action.value the custom emphasis value
   */
  editSelectionEmphasisAmplitude(
    state: ProjectState,
    action: PayloadAction<{clipId: string | undefined; value: number}>,
  ) {
    withAmplitudeEdit(state, action.payload.clipId, (newData, clip) => {
      clip.state.present.selectedPoints.forEach((p: number) => {
        const value = Math.max(0, Math.min(1, action.payload.value));
        newData[p] = {
          ...newData[p],
          amplitude:
            newData[p].amplitude > action.payload.value
              ? value
              : newData[p].amplitude,
          emphasis: newData[p].emphasis
            ? {...newData[p].emphasis, amplitude: value}
            : undefined,
        };
      });
    });
  },

  /**
   * Set a custom frequency on the emphasis points currently selected
   * @param action.value the custom emphasis value
   */
  editSelectionEmphasisFrequency(
    state: ProjectState,
    action: PayloadAction<{clipId: string | undefined; value: number}>,
  ) {
    withAmplitudeEdit(state, action.payload.clipId, (newData, clip) => {
      clip.state.present.selectedPoints.forEach((p: number) => {
        newData[p] = {
          ...newData[p],
          emphasis: newData[p].emphasis
            ? {...newData[p].emphasis, frequency: action.payload.value}
            : undefined,
        };
      });
    });
  },

  /**
   * Removes emphasis from the currently selected points
   * @param action.clipId The clip id
   */
  removeEmphasisFromSelectedPoints(
    state: ProjectState,
    action: PayloadAction<{clipId?: string}>,
  ) {
    withAmplitudeEdit(state, action.payload.clipId, (newData, clip) => {
      clip.state.present.selectedPoints.forEach(p => {
        newData[p] = {
          time: newData[p].time,
          amplitude: newData[p].amplitude,
        };
      });
      clip.state.present.selectedEmphasis = undefined;
    });
  },

  /**
   * Toggle the emphasis on the currently selected points
   * @param action.clipId The clip id
   */
  toggleEmphasisOnSelectedPoints(
    state: ProjectState,
    action: PayloadAction<{clipId?: string}>,
  ) {
    withAmplitudeEdit(state, action.payload.clipId, (newData, clip) => {
      let shouldRemove = true;
      clip.state.present.selectedPoints.some((p: number) => {
        if (!newData[p].emphasis) {
          shouldRemove = false;
          return true;
        }
        return false;
      });

      if (shouldRemove) {
        clip.state.present.selectedPoints.forEach(p => {
          newData[p] = {
            time: newData[p].time,
            amplitude: newData[p].amplitude,
          };
        });
      } else {
        clip.state.present.selectedPoints.forEach(p => {
          const emphasis = newData[p].emphasis
            ? newData[p].emphasis
            : {
                amplitude: newData[p].amplitude,
                frequency: frequencyForSharpness(EmphasisType.Medium),
              };
          newData[p] = {
            time: newData[p].time,
            amplitude: newData[p].amplitude,
            emphasis,
          };
        });
      }
    });
  },

  /**
   * Remove the emphasis on a single point
   * @param action.clipId The clip id
   * @param action.index The index of the point
   */
  removeEmphasisOnPoint(
    state: ProjectState,
    action: PayloadAction<{clipId?: string | undefined; index: number}>,
  ) {
    withAmplitudeEdit(state, action.payload.clipId, (newData, clip) => {
      newData[action.payload.index] = {
        time: newData[action.payload.index].time,
        amplitude: newData[action.payload.index].amplitude,
      };
      clip.state.present.selectedEmphasis = undefined;
    });
  },

  /**
   * Set the frequency on the emphasis points currently selected
   * @param action.clipId The clip id, if not provided, the current clip will be used
   * @param action.type the emphasis type
   */
  setEmphasisType(
    state: ProjectState,
    action: PayloadAction<{clipId?: string; type: EmphasisType}>,
  ) {
    withAmplitudeEdit(state, action.payload.clipId, (newData, clip) => {
      clip.state.present.selectedPoints.forEach((p: number) => {
        newData[p] = {
          ...newData[p],
          emphasis: newData[p].emphasis
            ? {
                ...newData[p].emphasis,
                frequency: frequencyForSharpness(action.payload.type),
              }
            : undefined,
        };
      });
    });
  },
};
