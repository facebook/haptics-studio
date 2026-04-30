/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {PayloadAction} from '@reduxjs/toolkit';
import Constants, {DefaultEmptyClipDuration} from '../../../globals/constants';
import {clipDuration} from '../../../globals/utils';
import {TimelineCursorType, TimeLineState} from '../../types';
import {ProjectState} from '../types';

export const timelineReducers = {
  /**
   * Store the current timeline state
   * @param action.clipId the clip id, if not provided, the current clip will be used
   * @param action.state the timeline state
   * @param action.cursor the type of cursor that originated the change
   */
  setTimelineState(
    state: ProjectState,
    action: PayloadAction<{
      clipId?: string;
      state: Partial<TimeLineState>;
      cursor: TimelineCursorType;
    }>,
  ) {
    const clip =
      state.clips[action.payload.clipId ?? state.currentClipId ?? ''];
    if (!clip || !clip.timeline) return;

    const startingWindowSize = clip.timeline.endTime - clip.timeline.startTime;
    let lastPoint = 0;
    if (clip.state.present.haptic) {
      const {amplitude, frequency = []} =
        clip.state.present.haptic?.signals.continuous.envelopes;
      lastPoint = Math.max(
        amplitude.length > 0
          ? amplitude[amplitude.length - 1].time
          : DefaultEmptyClipDuration,
        frequency.length > 0
          ? frequency[frequency.length - 1].time
          : DefaultEmptyClipDuration,
      );
    }

    if (action.payload.state.startTime !== undefined) {
      clip.timeline.startTime = action.payload.state.startTime;
    }
    if (action.payload.state.endTime !== undefined) {
      clip.timeline.endTime = action.payload.state.endTime;
    }
    if (Constants.trim.lockTrimmedArea && clip.trimAt) {
      clip.timeline.endTime = Math.min(clip.timeline.endTime, clip.trimAt);
      if (
        clip.timeline.endTime === clip.trimAt &&
        action.payload.cursor === TimelineCursorType.Center
      ) {
        clip.timeline.startTime = Math.max(
          clip.timeline.endTime - startingWindowSize,
          0,
        );
      }
    }
    if (action.payload.state.duration !== undefined) {
      clip.timeline.duration = action.payload.state.duration;
    }

    clip.timeline.duration = Math.max(lastPoint, clip.timeline.endTime);

    clip.timeline.endTime = Math.min(
      clip.timeline.duration,
      clip.timeline.endTime,
    );

    if (
      clip.timeline.endTime - clip.timeline.startTime <
      Constants.timeline.minimumZoomTime
    ) {
      if (clip.timeline.endTime === (clip.trimAt ?? clip.timeline.duration)) {
        clip.timeline.startTime =
          clip.timeline.endTime - Constants.timeline.minimumZoomTime;
      }
      if (clip.timeline.startTime === 0) {
        clip.timeline.endTime =
          clip.timeline.startTime + Constants.timeline.minimumZoomTime;
      }
    }
  },

  /**
   * Scroll the timeline
   * @param action.clipId the clip id
   * @param action.timeDelta the time delta
   */
  scrollTimeline(
    state: ProjectState,
    action: PayloadAction<{clipId: string; timeDelta: number}>,
  ) {
    const clip =
      state.clips[action.payload.clipId ?? state.currentClipId ?? ''];

    if (!clip || !clip.timeline) return;

    const end = clip.timeline.endTime + action.payload.timeDelta;

    clip.timeline.startTime += action.payload.timeDelta;
    clip.timeline.endTime = end;
    clip.timeline.duration = end;
  },

  /**
   * Update the playhead position
   * @param action.clipId the current clip id
   * @param action.time the time value
   */
  setPlayhead(
    state: ProjectState,
    action: PayloadAction<{clipId: string; time: number}>,
  ) {
    const clip =
      state.clips[action.payload.clipId ?? state.currentClipId ?? ''];
    if (!clip) return;

    const maxDuration = clipDuration(clip) || clip.timeline?.duration || 0;
    clip.playhead = Math.max(0, Math.min(action.payload.time, maxDuration));
  },

  /**
   * Update the playhead position failure
   * @param action.clipId the current clip id
   * @param action.previous the previous playhead value
   */
  setPlayheadFailure(
    state: ProjectState,
    action: PayloadAction<{clipId: string; previous: any}>,
  ) {
    const clip =
      state.clips[action.payload.clipId ?? state.currentClipId ?? ''];
    if (!clip) return;

    clip.playhead = action.payload.previous;
  },
};
