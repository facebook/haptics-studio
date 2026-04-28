/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-param-reassign */

import {
  AmplitudeBreakpoint,
  Envelopes,
  FrequencyBreakpoint,
} from '../../../../main/src/hapticsSdk';

import {
  Clip,
  ClipboardContent,
  EnvelopeType,
  TimelinePoint,
} from '../../state/types';
import Constants, {MinimumTimeSpacing} from '../constants';
import {linearInterpolationForAxisValue} from './coordinates';

/**
 * Get the envelopes from a selection of points. It applies the linear interpolation at the edges of the selection
 * to make sure that both the amplitude and frequency envelopes start and end at the same time.
 * @param envelopes the clip envelopes
 * @param envelopeType the current highlighted envelope
 * @param selectedPoints the selected points
 * @returns the envelopes and the range (as in min and max time) of the selection, undefined if the selection is empty
 */
export const envelopesFromSelection = (
  envelopes: Envelopes,
  envelopeType: EnvelopeType,
  selectedPoints: number[],
):
  | {
      amplitude: AmplitudeBreakpoint[];
      frequency: FrequencyBreakpoint[];
      range: {min: number; max: number};
    }
  | undefined => {
  if (selectedPoints.length === 0) return undefined;

  const source =
    (envelopeType === EnvelopeType.Amplitude
      ? envelopes.amplitude
      : envelopes.frequency) || [];

  const points = selectedPoints.map(p => source[p]);
  const timeValues = points.map(p => p.time);
  const range = {min: Math.min(...timeValues), max: Math.max(...timeValues)};
  const amplitude =
    envelopes.amplitude.filter(
      p => p.time >= range.min && p.time <= range.max,
    ) || [];
  const frequency =
    envelopes.frequency?.filter(
      p => p.time >= range.min && p.time <= range.max,
    ) || [];

  const slicedEnvelope = (
    envelope: TimelinePoint[],
    slice: TimelinePoint[],
    key: 'amplitude' | 'frequency',
  ): TimelinePoint[] => {
    const lastValue =
      envelope && envelope.length
        ? envelope[envelope.length - 1][key]
        : Constants.editing.defaultConstantEnvelopeValue;
    // Get the interpolated points at the start and end of the selection for the background envelope
    if (slice.length === 0 || slice[0].time > range.min) {
      // LERP left
      const leftIndex = envelope.findIndex(p => p.time > range.min) || 0;
      const p0 = envelope[leftIndex - 1];
      const p1 = envelope[leftIndex];

      if (p0 && p1) {
        const px: TimelinePoint = {
          time: range.min,
          [key]: linearInterpolationForAxisValue(
            {x: p0.time, y: p0[key] ?? 0},
            {x: p1.time, y: p1[key] ?? 0},
            range.min,
          ),
        };
        slice = [px, ...slice];
      } else if (!p0 && !p1) {
        slice = [{time: range.min, [key]: lastValue}];
      }
    }
    if (slice.length === 0 || slice[slice.length - 1].time < range.max) {
      // LERP right
      const rightIndex =
        envelope.findIndex(p => p.time > range.max) || envelope.length - 1;
      const p0 = envelope[rightIndex];
      const p1 = envelope[rightIndex - 1];

      if (p0 && p1) {
        const px: TimelinePoint = {
          time: range.max,
          [key]: linearInterpolationForAxisValue(
            {x: p0.time, y: p0[key] ?? 0},
            {x: p1.time, y: p1[key] ?? 0},
            range.max,
          ),
        };
        slice.push(px);
      } else if (!p0 && !p1) {
        slice.push({time: range.max, [key]: lastValue});
      }
    }
    return slice;
  };

  return {
    amplitude: slicedEnvelope(
      envelopes.amplitude,
      amplitude,
      'amplitude',
    ) as AmplitudeBreakpoint[],
    frequency: slicedEnvelope(
      envelopes.frequency ?? [],
      frequency,
      'frequency',
    ) as FrequencyBreakpoint[],
    range,
  };
};

/**
 * Create a new amplitude breakpoint at time `time`, with an amplitude that has the value of the
 * continuous signal described by `breakpoints` at the same time.
 * @param time the time for the new breakpoint
 * @param breakpoints the breakpoints to interpolate between
 * @returns the new breakpoint
 */
export const createInterpolatedBreakpoint = (
  time: number,
  breakpoints: AmplitudeBreakpoint[],
): AmplitudeBreakpoint => {
  let rightIndex = breakpoints.findIndex(p => p.time > time);
  if (rightIndex === -1) {
    rightIndex = breakpoints.length - 1;
  }
  const leftIndex = rightIndex - 1;
  const leftBreakpoint = breakpoints[leftIndex];
  const rightBreakpoint = breakpoints[rightIndex];
  const interpolatedBreakpoint: AmplitudeBreakpoint = {
    time,
    amplitude: linearInterpolationForAxisValue(
      {
        x: leftBreakpoint.time,
        y: leftBreakpoint.amplitude,
      },
      {
        x: rightBreakpoint.time,
        y: rightBreakpoint.amplitude,
      },
      time,
    ),
  };
  return interpolatedBreakpoint;
};

// Returns all amplitude breakpoints with emphasis from the haptic clip in the given clipboard
// content.
// Some breakpoints with emphasis will be skipped if they are too close together.
/**
 * Return all amplitude breakpoints with emphasis from the haptic clip in the given clipboard content
 * @param clipboardContent the clipboard content
 * @param clipLength the length of the clipboard slice
 * @returns the new breakpoints
 */
export const filterClipboardForEmphasisPaste = (
  clipboardContent: ClipboardContent,
  clipLength: number,
): AmplitudeBreakpoint[] => {
  // Filter out all clipboard breakpoints that don't have emphasis or are beyond the end of the clip
  const allClipboardAmplitudeBreakpointsWithEmphasis =
    clipboardContent.amplitude.filter(
      breakpoint => breakpoint.emphasis && breakpoint.time <= clipLength,
    );
  if (allClipboardAmplitudeBreakpointsWithEmphasis.length <= 0) {
    return [];
  }

  // Filter out clipboard breakpoints that are too close together
  const clipboardAmplitudeBreakpointsWithEmphasis: AmplitudeBreakpoint[] = [];
  allClipboardAmplitudeBreakpointsWithEmphasis.forEach(breakpoint => {
    if (clipboardAmplitudeBreakpointsWithEmphasis.length === 0) {
      clipboardAmplitudeBreakpointsWithEmphasis.push(breakpoint);
    } else {
      const previousBreakpoint =
        clipboardAmplitudeBreakpointsWithEmphasis[
          clipboardAmplitudeBreakpointsWithEmphasis.length - 1
        ];
      const breakpointsTooClose =
        breakpoint.time - previousBreakpoint.time < MinimumTimeSpacing;
      if (!breakpointsTooClose) {
        clipboardAmplitudeBreakpointsWithEmphasis.push(breakpoint);
      }
    }
  });
  return clipboardAmplitudeBreakpointsWithEmphasis;
};

export const pastedEnvelopes = (
  envelopes: Envelopes,
  clipboard: ClipboardContent,
  offset: number,
  inPlace: boolean,
): {amplitude: TimelinePoint[]; frequency: TimelinePoint[]} => {
  // Note: we are using only the amplitude data to gauge the pasted clip duration, since the two slices are normalized during the copy process
  const startTime: number = clipboard.amplitude[0].time;

  // Translate the clipboard data to a 0 origin and add the offset provided by the user
  const translatedAmplitude: TimelinePoint[] = inPlace
    ? clipboard.amplitude
    : (clipboard.amplitude as TimelinePoint[]).map(p => {
        return {...p, time: p.time - startTime + offset};
      });
  const translatedFrequency: TimelinePoint[] = inPlace
    ? clipboard.frequency
    : (clipboard.frequency as TimelinePoint[]).map(p => {
        return {...p, time: p.time - startTime + offset};
      });

  const newAmplitudeData: TimelinePoint[] = [...(envelopes.amplitude || [])];
  const newFrequencyData: TimelinePoint[] = [...(envelopes.frequency || [])];

  // Remove points that end up before the origin
  const filteredAmplitudeClipboard = translatedAmplitude.filter(
    f => f.time >= 0,
  );
  const filteredFrequencyClipboard = translatedFrequency.filter(
    f => f.time >= 0,
  );

  [
    {
      data: newAmplitudeData,
      clipboard: filteredAmplitudeClipboard,
      translatedPoints: translatedAmplitude,
      key: 'amplitude',
    },
    {
      data: newFrequencyData,
      clipboard: filteredFrequencyClipboard,
      translatedPoints: translatedFrequency,
      key: 'frequency',
    },
  ].forEach(envelope => {
    const clipboardStartsBeforeEnvelope =
      envelope.translatedPoints[0].time <= 0;
    const clipboardStartsAfterEnvelope =
      envelope.data.length === 0 ||
      envelope.translatedPoints[0].time >
        envelope.data[envelope.data.length - 1].time + MinimumTimeSpacing;
    const clipboardEndsAfterEnvelope =
      envelope.data.length === 0 ||
      envelope.translatedPoints[envelope.translatedPoints.length - 1].time >
        envelope.data[envelope.data.length - 1].time;
    const {key} = envelope;

    // Determine where to cut the old plot
    let clipboard = [...envelope.clipboard];
    if (clipboard.length > 0) {
      let leftCut = envelope.data.findIndex(p => p.time >= clipboard[0].time);

      // If the clipboard contains points earlier than 0 (e.g. if the user drags the paste window past the origin), we can cut at 0
      if (clipboardStartsBeforeEnvelope) {
        leftCut = 1;
      } else if (leftCut > -1) {
        // lerp left
        const time = clipboard[0].time - MinimumTimeSpacing;
        const lerpValue = linearInterpolationForAxisValue(
          {
            x: envelope.data[leftCut - 1].time,
            y: (envelope.data[leftCut - 1] as any)[key],
          },
          {
            x: envelope.data[leftCut].time,
            y: (envelope.data[leftCut] as any)[key],
          },
          time,
        );

        clipboard = [{time, [key]: lerpValue}, ...clipboard];
      }
      let rightCut = envelope.data.findIndex(
        p =>
          p.time >= clipboard[clipboard.length - 1].time + MinimumTimeSpacing,
      );

      // If the clipboard extends beyond the duration, we can cut at the last point
      if (clipboardEndsAfterEnvelope) {
        rightCut = envelope.data.length;
      } else if (rightCut > -1) {
        // lerp right
        const time = clipboard[clipboard.length - 1].time + MinimumTimeSpacing;
        const lerpValue = linearInterpolationForAxisValue(
          {
            x: envelope.data[rightCut - 1].time,
            y: (envelope.data[rightCut - 1] as any)[key],
          },
          {
            x: envelope.data[rightCut].time,
            y: (envelope.data[rightCut] as any)[key],
          },
          time,
        );

        clipboard = [...clipboard, {time, [key]: lerpValue}];
      }

      // If the clipboard starts after the original envelope ends, there is no need to splice
      // the original data, the envelopes can be joined by adding two new points
      // with a 0 value to avoid undesired bridges between the two
      if (clipboardStartsAfterEnvelope) {
        envelope.data.push({
          time:
            envelope.data.length > 0
              ? envelope.data[envelope.data.length - 1].time +
                MinimumTimeSpacing
              : 0,
          [key]: 0,
        });
        // Add the second point only if there is enough space, if not, the point is not needed
        if (
          envelope.data[envelope.data.length - 1].time + MinimumTimeSpacing <
          clipboard[0].time - MinimumTimeSpacing
        ) {
          envelope.data.push({
            time: clipboard[0].time - MinimumTimeSpacing,
            [key]: 0,
          });
        }
        envelope.data.push(...clipboard);
      } else {
        // If the clipboard's starting point is within the envelope, we need to splice the data instead
        envelope.data.splice(leftCut, rightCut - leftCut, ...clipboard);
      }

      if (clipboardStartsBeforeEnvelope) {
        // Find the two points around the cut and get the interpolated value
        const firstCut = envelope.translatedPoints.indexOf(clipboard[0]) - 1;
        let lerpValue = 0;
        if (firstCut >= 0 && envelope.translatedPoints.length > 2) {
          lerpValue = linearInterpolationForAxisValue(
            {
              x: envelope.translatedPoints[firstCut].time,
              y: (envelope.translatedPoints[firstCut] as any)[key],
            },
            {
              x: envelope.translatedPoints[firstCut + 1].time,
              y: (envelope.translatedPoints[firstCut + 1] as any)[key],
            },
            0,
          );
        }

        envelope.data[0].time = 0;
        (envelope.data[0] as any)[key] = lerpValue;
      }
    }
  });
  return {amplitude: newAmplitudeData, frequency: newFrequencyData};
};

export const pastedEmphasisEnvelope = (
  clip: Clip,
  clipboard: ClipboardContent,
): {amplitude: AmplitudeBreakpoint[] | undefined; skippedCount: number} => {
  const newAmplitudeBreakpoints = [
    ...(clip.state.present.haptic?.signals.continuous.envelopes.amplitude ||
      []),
  ];
  // Assume at least 2 breakpoints in current clip - the editor doesn't allow the user to delete
  // the first and last breakpoint anyway.
  if (newAmplitudeBreakpoints.length < 2) {
    return {amplitude: undefined, skippedCount: 0};
  }

  const clipLength =
    newAmplitudeBreakpoints[newAmplitudeBreakpoints.length - 1].time;
  const clipboardEmphasisBreakpoints = filterClipboardForEmphasisPaste(
    clipboard,
    clipLength,
  );
  if (clipboardEmphasisBreakpoints.length === 0) {
    return {amplitude: undefined, skippedCount: 0};
  }

  // Sort clipboard breakpoints by time to ensure consistent processing order
  const sortedClipboardBreakpoints = [...clipboardEmphasisBreakpoints].sort(
    (a, b) => a.time - b.time,
  );

  let skippedCount = 0;

  // For each breakpoint with emphasis in the clipboard, add the emphasis to the current clip
  // without modifying the underlying amplitude envelope.
  // If a point exists at the same time, attach the emphasis to it.
  // If no point exists, create an interpolated amplitude point and attach the emphasis to it.
  // Skip emphasis points where the emphasis amplitude is lower than the underlying amplitude.
  sortedClipboardBreakpoints.forEach(clipboardBreakpoint => {
    const emphasisTime = clipboardBreakpoint.time;
    const emphasisAmplitude = clipboardBreakpoint.emphasis?.amplitude;

    // Skip if emphasis has no amplitude defined
    if (emphasisAmplitude === undefined) {
      return;
    }

    // Check if there's an existing point at this time
    const existingPointIndex = newAmplitudeBreakpoints.findIndex(
      bp => bp.time === emphasisTime,
    );

    if (existingPointIndex !== -1) {
      const existingAmplitude =
        newAmplitudeBreakpoints[existingPointIndex].amplitude;

      // Skip if emphasis amplitude is lower than the underlying amplitude
      if (emphasisAmplitude < existingAmplitude) {
        skippedCount += 1;
        return;
      }

      // Point exists at this time - just add emphasis to it
      newAmplitudeBreakpoints[existingPointIndex] = {
        ...newAmplitudeBreakpoints[existingPointIndex],
        emphasis: clipboardBreakpoint.emphasis,
      };
    } else {
      // Point doesn't exist - create an interpolated breakpoint and add emphasis
      const interpolatedBreakpoint = createInterpolatedBreakpoint(
        emphasisTime,
        newAmplitudeBreakpoints,
      );

      // Skip if emphasis amplitude is lower than the interpolated amplitude
      if (emphasisAmplitude < interpolatedBreakpoint.amplitude) {
        skippedCount += 1;
        return;
      }

      // Add the emphasis to the interpolated breakpoint
      const newBreakpoint: AmplitudeBreakpoint = {
        ...interpolatedBreakpoint,
        emphasis: clipboardBreakpoint.emphasis,
      };

      // Insert the new breakpoint in the correct position (sorted by time)
      const insertIndex = newAmplitudeBreakpoints.findIndex(
        bp => bp.time > emphasisTime,
      );

      if (insertIndex === -1) {
        // Should not happen since emphasisTime <= clipLength, but handle anyway
        newAmplitudeBreakpoints.push(newBreakpoint);
      } else {
        newAmplitudeBreakpoints.splice(insertIndex, 0, newBreakpoint);
      }
    }
  });

  // Ensure final result is sorted by time
  return {
    amplitude: newAmplitudeBreakpoints.sort((a, b) => a.time - b.time),
    skippedCount,
  };
};
