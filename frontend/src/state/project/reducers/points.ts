/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import _ from 'lodash';

import {original} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';
import Constants, {MinimumTimeSpacing} from '../../../globals/constants';
import {
  AmplitudeBreakpoint,
  FrequencyBreakpoint,
} from '../../../../../main/src/hapticsSdk';
import {EditorPointData, EnvelopeBreakpoint, EnvelopeType, TimelinePoint} from '../../types';
import {ProjectState} from '../types';
import {
  resolveClip,
  setEnvelopeData,
  updatedClipState,
  withEnvelopeEdit,
} from './helpers';

export const pointsReducers = {
  /**
   * Set the selected points on the current envelope
   * @param action.clipId the clip id, if not provided the current clip will be used
   * @param action.points The indexes of the selected points
   */
  setSelectedPoints(
    state: ProjectState,
    action: PayloadAction<{
      clipId?: string | undefined;
      points: Array<number>;
      emphasis?: number | undefined;
    }>,
  ) {
    const clip = resolveClip(state, action.payload.clipId);
    if (!clip) return;

    const uniqueValues: number[] = [...new Set<number>(action.payload.points)];
    if (
      _.isEqual(uniqueValues, clip.state.present.selectedPoints) &&
      clip.state.present.selectedEmphasis === action.payload.emphasis
    )
      return;

    clip.state.present.selectedPoints = uniqueValues.sort((a, b) => a - b);
    if (_.has(action.payload, 'emphasis')) {
      clip.state.present.selectedEmphasis = action.payload.emphasis;
    }

    clip.state = updatedClipState(clip, original(clip.state.present));
  },

  /**
   * Select all the points from the current envelope
   * @param action.clipId the clip id, if not provided the current clip will be used
   */
  selectAllPoints(
    state: ProjectState,
    action: PayloadAction<{clipId?: string; envelope: EnvelopeType}>,
  ) {
    const clip = resolveClip(state, action.payload.clipId);
    if (!clip) return;

    const length =
      clip.state.present.haptic?.signals.continuous.envelopes[
        action.payload.envelope
      ]?.length ?? 0;
    const uniqueValues: number[] = [...Array(length).keys()];

    if (_.isEqual(uniqueValues, clip.state.present.selectedPoints)) return;

    clip.state.present.selectedPoints = uniqueValues.sort((a, b) => a - b);

    clip.state = updatedClipState(clip, original(clip.state.present));
  },

  /**
   * Edit a set of points from a given envelope, replacing a whole set
   * @param action.clipId The clip id; if not provided the current clip will be used
   * @param action.envelope The envelope to edit
   * @param action.points The new point values
   * @param action.select Optional argument that sets the changed points as selected
   */
  editPoints(
    state: ProjectState,
    action: PayloadAction<{
      clipId?: string;
      envelope: EnvelopeType;
      points: Array<EditorPointData>;
      select?: boolean;
    }>,
  ) {
    withEnvelopeEdit(
      state,
      action.payload.clipId,
      action.payload.envelope,
      (newData, clip) => {
        (action.payload.points as EditorPointData[]).forEach(
          (p: EditorPointData) => {
            const canMoveTimeValue = p.index > 0;
            if (p.emphasis && newData[p.index].emphasis === undefined) {
              clip.state.present.selectedEmphasis = p.index;
            }
            newData[p.index] = {
              time: canMoveTimeValue ? p.x : newData[p.index].time,
              [action.payload.envelope]: p.y,
              emphasis: p.emphasis
                ? {
                    amplitude: p.emphasis.y,
                    frequency:
                      newData[p.index] && newData[p.index].emphasis
                        ? newData[p.index].emphasis!.frequency
                        : 0,
                  }
                : undefined,
            };
          },
        );

        if (action.payload.select) {
          clip.state.present.selectedPoints = action.payload.points.map(
            p => p.index,
          );
        }
      },
    );
  },

  /**
   * Change the envelope value for the selected points to a given value
   * @param action.clipId the clipId involved
   * @param action.envelope the type of envelope to change
   * @param action.value the new value
   */
  editSelectionValue(
    state: ProjectState,
    action: PayloadAction<{
      clipId: string | undefined;
      envelope: EnvelopeType;
      value: number;
    }>,
  ) {
    withEnvelopeEdit(
      state,
      action.payload.clipId,
      action.payload.envelope,
      (newData, clip) => {
        clip.state.present.selectedPoints.forEach(index => {
          const value = Math.max(0, Math.min(1, action.payload.value));
          newData[index] = {
            ...newData[index],
            [action.payload.envelope]: value,
            emphasis:
              newData[index].emphasis &&
              value > newData[index].emphasis!.amplitude
                ? {...newData[index].emphasis!, amplitude: value}
                : newData[index].emphasis,
          };
        });
      },
    );
  },

  /**
   * Change the envelope value for specific points to a given value
   * @param action.clipId The clipId involved
   * @param action.envelope The type of envelope to change
   * @param action.indices The indices of the points to change
   * @param action.value The new value
   */
  editPointsValue(
    state: ProjectState,
    action: PayloadAction<{
      clipId: string | undefined;
      envelope: EnvelopeType;
      indices: number[];
      value: number;
    }>,
  ) {
    withEnvelopeEdit(
      state,
      action.payload.clipId,
      action.payload.envelope,
      newData => {
        action.payload.indices.forEach(index => {
          if (index < newData.length && index >= 0) {
            const value = Math.max(0, Math.min(1, action.payload.value));
            newData[index] = {
              ...newData[index],
              [action.payload.envelope]: value,
              emphasis:
                newData[index].emphasis &&
                value > newData[index].emphasis!.amplitude
                  ? {...newData[index].emphasis!, amplitude: value}
                  : newData[index].emphasis,
            };
          }
        });
      },
    );
  },

  /**
   * Change the time for the selected point
   * @param action.clipId The clipId involved
   * @param action.envelope The type of envelope to change
   * @param action.time The new time value
   */
  editSelectionTime(
    state: ProjectState,
    action: PayloadAction<{
      clipId: string | undefined;
      envelope: EnvelopeType;
      time: number;
    }>,
  ) {
    withEnvelopeEdit(
      state,
      action.payload.clipId,
      action.payload.envelope,
      (newData, clip) => {
        clip.state.present.selectedPoints.forEach(index => {
          if (index > 0) {
            let previous = 0;
            let next = clip.timeline?.duration ?? 0;
            let {time} = action.payload;
            if (index > 0) {
              previous = newData[index - 1].time;
            }
            if (index < newData.length - 1) {
              next = newData[index + 1].time;
            }
            if (time < previous + MinimumTimeSpacing) {
              time = previous + MinimumTimeSpacing;
            }
            if (time > next - MinimumTimeSpacing) {
              time = next - MinimumTimeSpacing;
            }
            newData[index] = {...newData[index], time};
          }
        });
      },
    );
  },

  /**
   * Delete a set of point from a given envelope
   * @param action.clipId The clip id, if not provided, the current clip will be used
   * @param action.envelope The envelope to edit
   * @param action.indexes The indexes of the point that will be deleted
   */
  deletePoints(
    state: ProjectState,
    action: PayloadAction<{
      clipId?: string;
      envelope: EnvelopeType;
      indexes: Array<number>;
    }>,
  ) {
    const clip = resolveClip(state, action.payload.clipId);
    if (!clip?.state.present.haptic) return;

    const envelopes = clip.state.present.haptic.signals.continuous.envelopes;
    let newData: EnvelopeBreakpoint[] = [...(envelopes[action.payload.envelope] || [])];
    const points = [...action.payload.indexes].filter(p => p !== 0);

    const indexSet = new Set(points);
    newData = newData.filter((_data, i) => !indexSet.has(i));

    clip.hasChanges[action.payload.envelope] = true;
    setEnvelopeData(envelopes, action.payload.envelope, newData);
    clip.state.present.selectedPoints = [];
    if (indexSet.size > 0) {
      clip.state.present.revision += 1;
      clip.state = updatedClipState(clip, original(clip.state.present));
    }
  },

  /**
   * Delete a set of point from a given envelope
   * @param action.clipId The clip id
   * @param action.envelope The envelope to edit
   * @param action.range The time range to delete
   */
  deletePointRange(
    state: ProjectState,
    action: PayloadAction<{
      clipId: string | undefined;
      envelopes: EnvelopeType[];
      range: {min: number; max: number};
    }>,
  ) {
    const clip = resolveClip(state, action.payload.clipId);
    if (!clip?.state.present.haptic) return;

    const envelopes = clip.state.present.haptic.signals.continuous.envelopes;
    action.payload.envelopes.forEach((envelope: EnvelopeType) => {
      let newData = [...(envelopes[envelope] || [])];
      newData = newData.filter(
        p =>
          p.time < action.payload.range.min ||
          p.time > action.payload.range.max,
      );
      setEnvelopeData(envelopes, envelope, newData as EnvelopeBreakpoint[]);
    });
    action.payload.envelopes.forEach(envelope => {
      clip.hasChanges[envelope] = true;
    });
    clip.state.present.selectedPoints = [];
    clip.state.present.revision += 1;

    clip.state = updatedClipState(clip, original(clip.state.present));
  },

  /**
   * Add a new point to a given envelope
   * @param action.clipId The clip id, if not provided, the current clip will be used
   * @param action.envelope The envelope that will receive the point
   * @param action.point The amplitude or frequency point
   */
  addPoint(
    state: ProjectState,
    action: PayloadAction<{
      clipId?: string;
      envelope: EnvelopeType;
      point: AmplitudeBreakpoint | FrequencyBreakpoint;
    }>,
  ) {
    const clip = resolveClip(state, action.payload.clipId);
    if (!clip?.state.present.haptic) return;

    const envelopes = clip.state.present.haptic.signals.continuous.envelopes;
    const newData: TimelinePoint[] = [...(envelopes[action.payload.envelope] || [])];
    const index = newData.findIndex(p => p.time >= action.payload.point.time);
    if (
      index > -1 &&
      Math.abs(newData[index].time - action.payload.point.time) <
        MinimumTimeSpacing
    ) {
      return;
    }
    const newIndex = index === -1 ? newData.length : index;
    newData.splice(newIndex, 0, action.payload.point);

    clip.hasChanges[action.payload.envelope] = true;
    setEnvelopeData(envelopes, action.payload.envelope, newData as EnvelopeBreakpoint[]);

    const otherEnvelope =
      action.payload.envelope === EnvelopeType.Amplitude
        ? EnvelopeType.Frequency
        : EnvelopeType.Amplitude;
    if (envelopes[otherEnvelope]?.length === 0) {
      if (otherEnvelope === EnvelopeType.Amplitude) {
        envelopes[otherEnvelope] = [
          {
            time: 0,
            amplitude: Constants.editing.defaultConstantEnvelopeValue,
          },
        ];
      } else {
        envelopes[otherEnvelope] = [
          {
            time: 0,
            frequency: Constants.editing.defaultConstantEnvelopeValue,
          },
        ];
      }
      clip.hasChanges[otherEnvelope] = true;
    }
    if (
      action.payload.envelope === EnvelopeType.Amplitude &&
      (action.payload.point as AmplitudeBreakpoint).emphasis
    ) {
      clip.state.present.selectedEmphasis = newIndex;
    }
    clip.state.present.selectedPoints = [newIndex];
    clip.state.present.revision += 1;

    clip.state = updatedClipState(clip, original(clip.state.present));
  },
};
