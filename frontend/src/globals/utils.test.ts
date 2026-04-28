/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {toMatchCloseTo} from 'jest-matcher-deep-close-to';
import {cleanup} from '../test-utils';
import {
  screenToTime,
  timeToScreen,
  euclideanDistance,
  emphasisTypeFrom,
  isSelectionRectValid,
  timelineFor,
  duplicatedClipsAndGroups,
  envelopesFromSelection,
  pastedEnvelopes,
  pastedEmphasisEnvelope,
  createInterpolatedBreakpoint,
  filterClipboardForEmphasisPaste,
  findAdjacentPoints,
  plotHoverState,
  getUniqueName,
  timeFromString,
  timeFormat,
} from './utils';
import Constants, {
  DefaultEmptyClipDuration,
  MinimumTimeSpacing,
} from './constants';
import editorDataMock from '../__mocks__/editorDataMock';
import editorLongDataMock from '../__mocks__/editorLongDataMock';
import editorPasteMock from '../__mocks__/editorPasteMock';
import baseClipState from '../__mocks__/clipMock';
import {
  Clip,
  ClipGroup,
  EditorPointData,
  EmphasisType,
  EnvelopeType,
  RenderMetadata,
} from '../state/types';

expect.extend({toMatchCloseTo});

afterEach(cleanup);

const renderMetadata: RenderMetadata = {
  width: 1000,
  height: 400,
  duration: 10,
  startTime: 0,
  margin: {top: 0, right: 0, bottom: 0, left: 0},
};

describe('utils::screenToTime', () => {
  test('should return the correct values with the mouse on the top left', () => {
    const p = screenToTime({x: 0, y: 0}, renderMetadata);

    expect(p).toEqual({x: 0, y: 1});
  });

  test('should return the correct values with the mouse on the bottom right', () => {
    const p = screenToTime(
      {x: renderMetadata.width * 2, y: renderMetadata.height * 2},
      renderMetadata,
    );

    expect(p).toEqual({x: renderMetadata.duration, y: 0});
  });

  test('should return the correct values with the mouse in the middle', () => {
    const p = screenToTime(
      {x: renderMetadata.width / 2, y: renderMetadata.height / 2},
      renderMetadata,
    );

    expect(p).toEqual({x: renderMetadata.duration / 2, y: 0.5});
  });
});

describe('utils::timeToScreen', () => {
  test('should return the correct values with the mouse on the top left', () => {
    const p = timeToScreen({x: 0, y: 1}, renderMetadata);

    expect(p).toEqual({x: 0, y: 0});
  });

  test('should return the correct values with the mouse on the bottom right', () => {
    const p = timeToScreen({x: renderMetadata.duration, y: 0}, renderMetadata);

    expect(p).toEqual({x: renderMetadata.width, y: renderMetadata.height});
  });

  test('should return the correct values with the mouse in the middle', () => {
    const p = timeToScreen(
      {x: renderMetadata.duration / 2, y: 0.5},
      renderMetadata,
    );

    expect(p).toEqual({
      x: renderMetadata.width / 2,
      y: renderMetadata.height / 2,
    });
  });
});

describe('utils::euclideanDistance', () => {
  test('should return the correct distance between points', () => {
    expect(euclideanDistance({x: 0, y: 100}, {x: 0, y: 200})).toEqual(100);
    expect(euclideanDistance({x: 100, y: 0}, {x: 200, y: 0})).toEqual(100);
    expect(euclideanDistance({x: 0, y: -100}, {x: 0, y: 100})).toEqual(200);
    expect(euclideanDistance({x: -100, y: 0}, {x: 100, y: 0})).toEqual(200);
    expect(euclideanDistance({x: 10, y: 10}, {x: 50, y: 40})).toEqual(50);
  });
});

describe('utils::emphasisTypeFrom', () => {
  test('should return the correct type', () => {
    expect(emphasisTypeFrom(0.2)).toEqual(EmphasisType.Round);
    expect(emphasisTypeFrom(0.05)).toEqual(EmphasisType.Round);

    expect(emphasisTypeFrom(0.4)).toEqual(EmphasisType.Medium);
    expect(emphasisTypeFrom(0.6)).toEqual(EmphasisType.Medium);

    expect(emphasisTypeFrom(0.8)).toEqual(EmphasisType.Sharp);
    expect(emphasisTypeFrom(1.0)).toEqual(EmphasisType.Sharp);
  });
});

describe('utils::isSelectionRectValid', () => {
  test('should return false if the rect is not valid', () => {
    expect(isSelectionRectValid({})).toEqual(false);
    expect(isSelectionRectValid({x0: 1})).toEqual(false);
    expect(isSelectionRectValid({x0: 1, x1: 1})).toEqual(false);
    expect(isSelectionRectValid({x0: 1, x1: 1, y0: 1})).toEqual(false);
  });

  test('should return true if the rect is not valid', () => {
    expect(
      isSelectionRectValid({
        x0: Math.random() % 10,
        x1: Math.random() % 10,
        y0: Math.random() % 10,
        y1: Math.random() % 10,
      }),
    ).toEqual(true);
  });
});

describe('utils::timelineFor', () => {
  test('should return the samples count', () => {
    expect(timelineFor(editorDataMock.haptic).samples).toEqual(10);
  });

  test('should return the amplitude length as the clip duration', () => {
    const {amplitude} = editorLongDataMock.haptic.signals.continuous.envelopes;
    expect(timelineFor(editorLongDataMock.haptic).duration).toMatchCloseTo(
      amplitude[amplitude.length - 1].time,
    );
  });

  test('should return the window size', () => {
    expect(timelineFor(editorLongDataMock.haptic).endTime).toMatchCloseTo(
      2.5,
      0.1,
    );
  });

  test('should return the default duration when the envelopes are empty', () => {
    expect(
      timelineFor({
        ...editorDataMock.haptic,
        signals: {
          continuous: {
            envelopes: {
              amplitude: [],
              frequency: [],
            },
          },
        },
      }).duration,
    ).toEqual(DefaultEmptyClipDuration);
  });
});

describe('utils::duplicatedClipsAndGroups', () => {
  test('should return the new data structures', () => {
    const c = {
      c1: {name: 'clip 1', audio: {name: '', path: ''}},
      c2: {name: 'clip 2', audio: {name: '', path: ''}},
      c3: {name: 'clip 2 (1)', audio: {name: '', path: ''}},
      c4: {name: 'clip 4', audio: {name: '', path: ''}},
      c5: {name: 'clip 5', audio: {name: '', path: ''}},
      c6: {name: 'clip 6', audio: {name: '', path: ''}},
    };
    const g: ClipGroup[] = [
      {id: 'g1', name: 'group 1', isFolder: true, clips: ['c1', 'c2', 'c3']},
      {id: 'g2', name: 'group 2', isFolder: true, clips: ['c4', 'c5']},
      {id: 'g3', name: 'group 3', isFolder: false, clips: ['c6']},
    ];
    const {groups, clips, duplicatedClips, duplicatedGroups} =
      duplicatedClipsAndGroups(
        {clips: ['c1', 'c2', 'c6'], groups: ['g2']},
        g,
        c as unknown as Record<string, Clip>,
      );
    expect(duplicatedClips.length).toEqual(5);
    expect(duplicatedClips[0].name).toEqual('clip 1 (1)');
    expect(duplicatedClips[1].name).toEqual('clip 2 (2)');
    expect(duplicatedGroups.length).toEqual(1);
    expect(groups[0].clips.length).toEqual(5);
    expect(groups.length).toEqual(5);
    expect(Object.keys(clips).length).toEqual(5);
  });

  test('should not create extra ungrouped clips when duplicating a group', () => {
    const c = {
      c1: {name: 'clip 1', audio: {name: '', path: ''}},
      c2: {name: 'clip 2', audio: {name: '', path: ''}},
    };
    const g: ClipGroup[] = [
      {id: 'g1', name: 'group 1', isFolder: true, clips: ['c1', 'c2']},
    ];
    const {groups, duplicatedClips, duplicatedGroups} =
      duplicatedClipsAndGroups(
        {clips: [], groups: ['g1']},
        g,
        c as unknown as Record<string, Clip>,
      );
    expect(duplicatedClips.length).toEqual(2);
    expect(duplicatedGroups.length).toEqual(1);

    expect(groups.length).toEqual(2);
    expect(groups[0].isFolder).toEqual(true);
    expect(groups[1].isFolder).toEqual(true);
    expect(groups[1].clips.length).toEqual(2);
    expect(groups[1].clips).toContain(duplicatedClips[0].clipId);
    expect(groups[1].clips).toContain(duplicatedClips[1].clipId);
  });
});

describe('utils::envelopesFromSelection', () => {
  const getEnvelopes = (selection: number[], envelope: EnvelopeType) => {
    return envelopesFromSelection(
      editorPasteMock.haptic.signals.continuous.envelopes,
      envelope,
      selection,
    );
  };

  test('should return the envelopes that contains the selected points only', () => {
    const result = getEnvelopes([0, 4], EnvelopeType.Amplitude);

    expect(result?.amplitude.length).toEqual(5);
  });

  test('should return the truncated and interpolated envelope for the background envelope', () => {
    // Note: the user copies the foreground envelope (either amp or freq), the background envelope
    // is the remaining envelope that needs to be truncated to have the same length (points might not match in time)
    const result = getEnvelopes([0, 4], EnvelopeType.Amplitude);

    expect(result?.frequency[4].time).toEqual(result?.amplitude[4].time);
    expect(result?.frequency[4].frequency).toMatchCloseTo(0.25);
  });

  test('should return the time range of the selection', () => {
    const result = getEnvelopes([1, 4], EnvelopeType.Amplitude);

    expect(result?.range.min).toEqual(0.1);
    expect(result?.range.max).toEqual(0.4);
  });

  test('should return a constant default value if one of the envelopes is empty', () => {
    const result = envelopesFromSelection(
      {
        amplitude: [
          {time: 0, amplitude: 0.5},
          {time: 0.2, amplitude: 1.0},
          {time: 0.4, amplitude: 0.5},
          {time: 0.6, amplitude: 0.0},
        ],
        frequency: [],
      },
      EnvelopeType.Amplitude,
      [1, 2],
    );
    expect(result?.frequency.length).toEqual(2);
    expect(result?.frequency[0]).toEqual({
      time: 0.2,
      frequency: Constants.editing.defaultConstantEnvelopeValue,
    });
    expect(result?.frequency[1]).toEqual({
      time: 0.4,
      frequency: Constants.editing.defaultConstantEnvelopeValue,
    });
  });

  test('should return the last point value when the envelope out of focus is shorter and the selected points range include 0 points', () => {
    const result = envelopesFromSelection(
      {
        amplitude: [
          {time: 0, amplitude: 0.5},
          {time: 0.2, amplitude: 1.0},
          {time: 0.4, amplitude: 0.5},
          {time: 0.6, amplitude: 0.0},
        ],
        frequency: [
          {time: 0, frequency: 0.5},
          {time: 0.1, frequency: 0.2},
        ],
      },
      EnvelopeType.Amplitude,
      [1, 2],
    );
    expect(result?.frequency.length).toEqual(2);
    expect(result?.frequency[0]).toEqual({time: 0.2, frequency: 0.2});
    expect(result?.frequency[1]).toEqual({time: 0.4, frequency: 0.2});
  });
});

describe('utils::pastedEnvelopes', () => {
  test('should merge the envelopes with the clipboard points', () => {
    const result = pastedEnvelopes(
      {
        amplitude: [
          {time: 0, amplitude: 0},
          {time: 1, amplitude: 1},
        ],
        frequency: [
          {time: 0, frequency: 0},
          {time: 1, frequency: 1},
        ],
      },
      {
        amplitude: [
          {time: 0.4, amplitude: 1},
          {time: 0.6, amplitude: 0},
        ],
        frequency: [
          {time: 0.4, frequency: 1},
          {time: 0.6, frequency: 0},
        ],
      },
      0.4,
      false,
    );

    expect(result).toMatchCloseTo({
      amplitude: [
        {time: 0, amplitude: 0},
        // Note, amplitude matches the time since we are drawing on a diagonal of a square
        {time: 0.4 - MinimumTimeSpacing, amplitude: 0.4 - MinimumTimeSpacing},
        {time: 0.4, amplitude: 1},
        {time: 0.6, amplitude: 0},
        {time: 0.6 + MinimumTimeSpacing, amplitude: 0.6 + MinimumTimeSpacing},
        {time: 1, amplitude: 1},
      ],
      frequency: [
        {time: 0, frequency: 0},
        {time: 0.4 - MinimumTimeSpacing, frequency: 0.4 - MinimumTimeSpacing},
        {time: 0.4, frequency: 1},
        {time: 0.6, frequency: 0},
        {time: 0.6 + MinimumTimeSpacing, frequency: 0.6 + MinimumTimeSpacing},
        {time: 1, frequency: 1},
      ],
    });
  });

  test('should handle the paste operation when the clipboard data is beyond the current clip length', () => {
    const result = pastedEnvelopes(
      {
        amplitude: [
          {time: 0, amplitude: 0},
          {time: 1, amplitude: 1},
        ],
        frequency: [
          {time: 0, frequency: 0},
          {time: 1, frequency: 1},
        ],
      },
      {
        amplitude: [
          {time: 0, amplitude: 1},
          {time: 1, amplitude: 0},
        ],
        frequency: [
          {time: 0, frequency: 1},
          {time: 1, frequency: 0},
        ],
      },
      2,
      false,
    );

    expect(result).toMatchCloseTo({
      amplitude: [
        {time: 0, amplitude: 0},
        {time: 1, amplitude: 1},
        {time: 1 + MinimumTimeSpacing, amplitude: 0},
        {time: 2 - MinimumTimeSpacing, amplitude: 0},
        {time: 2, amplitude: 1},
        {time: 3, amplitude: 0},
      ],
      frequency: [
        {time: 0, frequency: 0},
        {time: 1, frequency: 1},
        {time: 1 + MinimumTimeSpacing, frequency: 0},
        {time: 2 - MinimumTimeSpacing, frequency: 0},
        {time: 2, frequency: 1},
        {time: 3, frequency: 0},
      ],
    });
  });
});

describe('utils::findAdjacentPoints', () => {
  const data: EditorPointData[] = [
    {x: 0, y: 0, index: 0},
    {x: 0.1, y: 0, index: 1},
    {x: 0.2, y: 0, index: 2},
    {x: 0.3, y: 0, index: 3},
    {x: 0.4, y: 0, index: 4},
    {x: 0.5, y: 0, index: 5},
    {x: 0.6, y: 0, index: 6},
    {x: 0.7, y: 0, index: 7},
    {x: 0.8, y: 0, index: 8},
    {x: 0.9, y: 0, index: 9},
    {x: 1.0, y: 0, index: 10},
  ];

  test('should return the points to the left and right of a given time value', () => {
    const result = findAdjacentPoints(data, 0.45);

    expect(result.left?.index).toEqual(4);
    expect(result.right?.index).toEqual(5);
  });

  test('should return the the point at the given time value, within a tolerance', () => {
    let result = findAdjacentPoints(data, 0.49, 0.02);

    expect(result.left?.index).toEqual(4);
    expect(result.match?.index).toEqual(5);
    expect(result.right?.index).toEqual(6);

    result = findAdjacentPoints(data, 1.01, 0.02);

    expect(result.left?.index).toEqual(9);
    expect(result.match?.index).toEqual(10);
    expect(result.right).toBeUndefined();
  });

  test('should return the last point as `right` if the time is out of bounds', () => {
    const result = findAdjacentPoints(data, 2);

    expect(result.left?.index).toEqual(10);
    expect(result.right).toBeUndefined();
  });
});

describe('utils::plotHoverState', () => {
  const data: EditorPointData[] = [
    {x: 0, y: 0, index: 0},
    {x: 1, y: 0, index: 1},
    {x: 2, y: 0, index: 2},
    {x: 3, y: 0, index: 3},
    {x: 4, y: 0, index: 4},
    {x: 5, y: 0.5, index: 5},
    {x: 6, y: 0, index: 6},
    {x: 7, y: 0, index: 7},
    {x: 8, y: 0, index: 8},
    {x: 9, y: 0, index: 9},
    {x: 10, y: 0, index: 10},
  ];

  test('should return the adjacent points and a set of the closest point indices', () => {
    const result = plotHoverState({x: 500, y: 100}, data, renderMetadata, 0.01);

    expect(result.adjacentPoints.left?.index).toEqual(4);
    expect(result.adjacentPoints.match?.index).toEqual(5);
    expect(result.adjacentPoints.right?.index).toEqual(6);
    expect(result.closestPoints).toEqual(new Set([4, 5, 6]));
  });

  test('should return the point under the mouse cursor', () => {
    const mouseY = renderMetadata.height / 2;
    const result = plotHoverState(
      {x: 500, y: mouseY},
      data,
      renderMetadata,
      0.01,
    );

    expect(result.hoveredPointIndex).toEqual(5);
  });
});

describe('utils::getUniqueName', () => {
  test('should add the first unique index to an existing name', () => {
    const otherNames = ['clip', 'clip (test)'];
    const result = getUniqueName('clip', otherNames);

    expect(result).toEqual('clip (1)');
  });

  test('should add the correct increasing unique index to an existing name', () => {
    const otherNames = ['clip', 'clip (1)', 'clip (2)', 'clip (3)'];
    const result = getUniqueName('clip', otherNames);

    expect(result).toEqual('clip (4)');
  });
});

describe('utils::timeFromString', () => {
  test('should convert the time string into its time value', () => {
    expect(timeFromString('2')).toEqual(2);
    expect(timeFromString('2.2')).toEqual(2.2);
    expect(timeFromString('1.23')).toEqual(1.23);
    expect(timeFromString('1:02:10')).toEqual(62.1);
  });
});

describe('utils::timeFormat', () => {
  test('should format time in seconds.milliseconds for times under 60 seconds', () => {
    expect(timeFormat(0)).toEqual('00.000');
    expect(timeFormat(1)).toEqual('01.000');
    expect(timeFormat(1.5)).toEqual('01.500');
    expect(timeFormat(10.123)).toEqual('10.123');
    expect(timeFormat(59.999)).toEqual('59.999');
  });

  test('should format time in minutes:seconds.milliseconds for times over 60 seconds', () => {
    expect(timeFormat(60)).toEqual('1:00.000');
    expect(timeFormat(61.5)).toEqual('1:01.500');
    expect(timeFormat(125.123)).toEqual('2:05.123');
  });

  test('should format time in minutes:seconds.milliseconds when markers is true', () => {
    expect(timeFormat(0, true)).toEqual('0:00.000');
    expect(timeFormat(1.5, true)).toEqual('0:01.500');
    expect(timeFormat(30.123, true)).toEqual('0:30.123');
  });

  test('should handle edge case with floating point precision', () => {
    expect(timeFormat(0.9999999999999999)).toEqual('01.000');
    expect(timeFormat(1.9999999999999999)).toEqual('02.000');
    expect(timeFormat(2.9999999999999999)).toEqual('03.000');
  });
});

describe('utils::createInterpolatedBreakpoint', () => {
  test('should create a breakpoint with interpolated amplitude value', () => {
    const breakpoints = [
      {time: 0, amplitude: 0},
      {time: 1, amplitude: 1},
    ];
    const result = createInterpolatedBreakpoint(0.5, breakpoints);

    expect(result.time).toEqual(0.5);
    expect(result.amplitude).toBeCloseTo(0.5);
  });

  test('should interpolate correctly at arbitrary positions', () => {
    const breakpoints = [
      {time: 0, amplitude: 0.2},
      {time: 0.5, amplitude: 0.8},
      {time: 1, amplitude: 0.4},
    ];

    const result1 = createInterpolatedBreakpoint(0.25, breakpoints);
    expect(result1.time).toEqual(0.25);
    expect(result1.amplitude).toBeCloseTo(0.5);

    const result2 = createInterpolatedBreakpoint(0.75, breakpoints);
    expect(result2.time).toEqual(0.75);
    expect(result2.amplitude).toBeCloseTo(0.6);
  });

  test('should handle time at the end of the envelope', () => {
    const breakpoints = [
      {time: 0, amplitude: 0},
      {time: 0.5, amplitude: 0.5},
      {time: 1, amplitude: 1},
    ];
    const result = createInterpolatedBreakpoint(1.5, breakpoints);

    expect(result.time).toEqual(1.5);
  });
});

describe('utils::filterClipboardForEmphasisPaste', () => {
  test('should return only breakpoints with emphasis', () => {
    const clipboard = {
      amplitude: [
        {time: 0, amplitude: 0.5},
        {time: 0.2, amplitude: 0.8, emphasis: {amplitude: 0.9, frequency: 0.5}},
        {time: 0.4, amplitude: 0.3},
        {time: 0.6, amplitude: 0.7, emphasis: {amplitude: 0.8, frequency: 0.6}},
      ],
      frequency: [],
    };
    const result = filterClipboardForEmphasisPaste(clipboard, 1.0);

    expect(result.length).toEqual(2);
    expect(result[0].time).toEqual(0.2);
    expect(result[1].time).toEqual(0.6);
  });

  test('should return empty array if no breakpoints have emphasis', () => {
    const clipboard = {
      amplitude: [
        {time: 0, amplitude: 0.5},
        {time: 0.5, amplitude: 0.8},
        {time: 1, amplitude: 0.3},
      ],
      frequency: [],
    };
    const result = filterClipboardForEmphasisPaste(clipboard, 1.0);

    expect(result.length).toEqual(0);
  });

  test('should filter out breakpoints beyond clip length', () => {
    const clipboard = {
      amplitude: [
        {time: 0.2, amplitude: 0.5, emphasis: {amplitude: 0.6, frequency: 0.5}},
        {time: 0.8, amplitude: 0.8, emphasis: {amplitude: 0.9, frequency: 0.5}},
        {time: 1.5, amplitude: 0.3, emphasis: {amplitude: 0.4, frequency: 0.5}},
      ],
      frequency: [],
    };
    const result = filterClipboardForEmphasisPaste(clipboard, 1.0);

    expect(result.length).toEqual(2);
    expect(result[0].time).toEqual(0.2);
    expect(result[1].time).toEqual(0.8);
  });

  test('should filter out breakpoints that are too close together', () => {
    const clipboard = {
      amplitude: [
        {time: 0.1, amplitude: 0.5, emphasis: {amplitude: 0.6, frequency: 0.5}},
        {
          time: 0.1 + MinimumTimeSpacing / 2,
          amplitude: 0.6,
          emphasis: {amplitude: 0.7, frequency: 0.5},
        },
        {time: 0.5, amplitude: 0.8, emphasis: {amplitude: 0.9, frequency: 0.5}},
      ],
      frequency: [],
    };
    const result = filterClipboardForEmphasisPaste(clipboard, 1.0);

    expect(result.length).toEqual(2);
    expect(result[0].time).toEqual(0.1);
    expect(result[1].time).toEqual(0.5);
  });
});

describe('utils::pastedEmphasisEnvelope', () => {
  test('should return undefined if clip has fewer than 2 breakpoints', () => {
    const clip = baseClipState({
      amplitudeBreakpoints: [{time: 0, amplitude: 0.5}],
    });
    const clipboard = {
      amplitude: [
        {time: 0.2, amplitude: 0.8, emphasis: {amplitude: 0.9, frequency: 0.5}},
      ],
      frequency: [],
    };

    const result = pastedEmphasisEnvelope(clip, clipboard);
    expect(result.amplitude).toBeUndefined();
    expect(result.skippedCount).toEqual(0);
  });

  test('should return undefined if clipboard has no emphasis breakpoints', () => {
    const clip = baseClipState({
      amplitudeBreakpoints: [
        {time: 0, amplitude: 0.5},
        {time: 1, amplitude: 0.5},
      ],
    });
    const clipboard = {
      amplitude: [
        {time: 0.2, amplitude: 0.8},
        {time: 0.5, amplitude: 0.3},
      ],
      frequency: [],
    };

    const result = pastedEmphasisEnvelope(clip, clipboard);
    expect(result.amplitude).toBeUndefined();
    expect(result.skippedCount).toEqual(0);
  });

  test('should return undefined if all clipboard emphasis amplitudes are undefined', () => {
    const clip = baseClipState({
      amplitudeBreakpoints: [
        {time: 0, amplitude: 0.2},
        {time: 1, amplitude: 0.3},
      ],
    });
    const clipboard = {
      amplitude: [{time: 0.5, amplitude: 0.8, emphasis: undefined}],
      frequency: [],
    };

    const result = pastedEmphasisEnvelope(clip, clipboard);
    expect(result.amplitude).toBeUndefined();
    expect(result.skippedCount).toEqual(0);
  });

  test('should attach emphasis to existing point at the same time', () => {
    const clip = baseClipState({
      amplitudeBreakpoints: [
        {time: 0, amplitude: 0.2},
        {time: 0.5, amplitude: 0.5},
        {time: 1, amplitude: 0.3},
      ],
    });
    const clipboard = {
      amplitude: [
        {time: 0.5, amplitude: 0.8, emphasis: {amplitude: 0.9, frequency: 0.6}},
      ],
      frequency: [],
    };

    const result = pastedEmphasisEnvelope(clip, clipboard);

    expect(result.amplitude).toBeDefined();
    expect(result.amplitude!.length).toEqual(3);
    const pointAtTime05 = result.amplitude!.find(p => p.time === 0.5);
    expect(pointAtTime05).toBeDefined();
    expect(pointAtTime05!.amplitude).toEqual(0.5);
    expect(pointAtTime05!.emphasis).toEqual({amplitude: 0.9, frequency: 0.6});
    expect(result.skippedCount).toEqual(0);
  });

  test('should create interpolated point when no point exists at emphasis time', () => {
    const clip = baseClipState({
      amplitudeBreakpoints: [
        {time: 0, amplitude: 0},
        {time: 1, amplitude: 1},
      ],
    });
    const clipboard = {
      amplitude: [
        {time: 0.5, amplitude: 0.8, emphasis: {amplitude: 0.9, frequency: 0.5}},
      ],
      frequency: [],
    };

    const result = pastedEmphasisEnvelope(clip, clipboard);

    expect(result.amplitude).toBeDefined();
    expect(result.amplitude!.length).toEqual(3);
    const newPoint = result.amplitude!.find(p => p.time === 0.5);
    expect(newPoint).toBeDefined();
    expect(newPoint!.amplitude).toBeCloseTo(0.5);
    expect(newPoint!.emphasis).toEqual({amplitude: 0.9, frequency: 0.5});
    expect(result.skippedCount).toEqual(0);
  });

  test('should skip emphasis when emphasis amplitude is lower than existing point amplitude', () => {
    const clip = baseClipState({
      amplitudeBreakpoints: [
        {time: 0, amplitude: 0.2},
        {time: 0.5, amplitude: 0.8},
        {time: 1, amplitude: 0.3},
      ],
    });
    const clipboard = {
      amplitude: [
        {time: 0.5, amplitude: 0.5, emphasis: {amplitude: 0.5, frequency: 0.5}},
      ],
      frequency: [],
    };

    const result = pastedEmphasisEnvelope(clip, clipboard);

    expect(result.amplitude).toBeDefined();
    expect(result.amplitude!.length).toEqual(3);
    const pointAtTime05 = result.amplitude!.find(p => p.time === 0.5);
    expect(pointAtTime05).toBeDefined();
    expect(pointAtTime05!.emphasis).toBeUndefined();
    expect(result.skippedCount).toEqual(1);
  });

  test('should skip emphasis when emphasis amplitude is lower than interpolated amplitude', () => {
    const clip = baseClipState({
      amplitudeBreakpoints: [
        {time: 0, amplitude: 0.6},
        {time: 1, amplitude: 0.8},
      ],
    });
    const clipboard = {
      amplitude: [
        {time: 0.5, amplitude: 0.5, emphasis: {amplitude: 0.5, frequency: 0.5}},
      ],
      frequency: [],
    };

    const result = pastedEmphasisEnvelope(clip, clipboard);

    expect(result.amplitude).toBeDefined();
    expect(result.amplitude!.length).toEqual(2);
    expect(result.amplitude!.find(p => p.time === 0.5)).toBeUndefined();
    expect(result.skippedCount).toEqual(1);
  });

  test('should apply emphasis when emphasis amplitude equals underlying amplitude', () => {
    const clip = baseClipState({
      amplitudeBreakpoints: [
        {time: 0, amplitude: 0.5},
        {time: 1, amplitude: 0.5},
      ],
    });
    const clipboard = {
      amplitude: [
        {time: 0.5, amplitude: 0.5, emphasis: {amplitude: 0.5, frequency: 0.5}},
      ],
      frequency: [],
    };

    const result = pastedEmphasisEnvelope(clip, clipboard);

    expect(result.amplitude).toBeDefined();
    expect(result.amplitude!.length).toEqual(3);
    const newPoint = result.amplitude!.find(p => p.time === 0.5);
    expect(newPoint).toBeDefined();
    expect(newPoint!.emphasis).toEqual({amplitude: 0.5, frequency: 0.5});
    expect(result.skippedCount).toEqual(0);
  });

  test('should handle multiple emphasis points', () => {
    const clip = baseClipState({
      amplitudeBreakpoints: [
        {time: 0, amplitude: 0.2},
        {time: 1, amplitude: 0.2},
      ],
    });
    const clipboard = {
      amplitude: [
        {
          time: 0.25,
          amplitude: 0.8,
          emphasis: {amplitude: 0.8, frequency: 0.5},
        },
        {time: 0.5, amplitude: 0.9, emphasis: {amplitude: 0.9, frequency: 0.6}},
        {
          time: 0.75,
          amplitude: 0.7,
          emphasis: {amplitude: 0.7, frequency: 0.4},
        },
      ],
      frequency: [],
    };

    const result = pastedEmphasisEnvelope(clip, clipboard);

    expect(result.amplitude).toBeDefined();
    expect(result.amplitude!.length).toEqual(5);
    expect(
      result.amplitude!.find(p => p.time === 0.25)?.emphasis,
    ).toBeDefined();
    expect(result.amplitude!.find(p => p.time === 0.5)?.emphasis).toBeDefined();
    expect(
      result.amplitude!.find(p => p.time === 0.75)?.emphasis,
    ).toBeDefined();
  });

  test('should maintain time-sorted order in result', () => {
    const clip = baseClipState({
      amplitudeBreakpoints: [
        {time: 0, amplitude: 0.2},
        {time: 1, amplitude: 0.2},
      ],
    });
    const clipboard = {
      amplitude: [
        {
          time: 0.75,
          amplitude: 0.7,
          emphasis: {amplitude: 0.7, frequency: 0.4},
        },
        {
          time: 0.25,
          amplitude: 0.8,
          emphasis: {amplitude: 0.8, frequency: 0.5},
        },
        {time: 0.5, amplitude: 0.9, emphasis: {amplitude: 0.9, frequency: 0.6}},
      ],
      frequency: [],
    };

    const result = pastedEmphasisEnvelope(clip, clipboard);

    expect(result.amplitude).toBeDefined();
    for (let i = 1; i < result.amplitude!.length; i++) {
      expect(result.amplitude![i].time).toBeGreaterThan(
        result.amplitude![i - 1].time,
      );
    }
  });

  test('should not modify the original clip amplitude values', () => {
    const clip = baseClipState({
      amplitudeBreakpoints: [
        {time: 0, amplitude: 0.3},
        {time: 0.5, amplitude: 0.6},
        {time: 1, amplitude: 0.4},
      ],
    });
    const clipboard = {
      amplitude: [
        {time: 0.5, amplitude: 0.9, emphasis: {amplitude: 0.9, frequency: 0.5}},
      ],
      frequency: [],
    };

    const result = pastedEmphasisEnvelope(clip, clipboard);

    expect(result.amplitude).toBeDefined();
    const pointAtTime05 = result.amplitude!.find(p => p.time === 0.5);
    expect(pointAtTime05!.amplitude).toEqual(0.6);
  });

  test('should handle emphasis at clip boundaries', () => {
    const clip = baseClipState({
      amplitudeBreakpoints: [
        {time: 0, amplitude: 0.2},
        {time: 1, amplitude: 0.3},
      ],
    });
    const clipboard = {
      amplitude: [
        {time: 0, amplitude: 0.5, emphasis: {amplitude: 0.5, frequency: 0.5}},
        {time: 1, amplitude: 0.6, emphasis: {amplitude: 0.6, frequency: 0.5}},
      ],
      frequency: [],
    };

    const result = pastedEmphasisEnvelope(clip, clipboard);

    expect(result.amplitude).toBeDefined();
    expect(result.amplitude!.length).toEqual(2);
    expect(result.amplitude![0].emphasis).toEqual({
      amplitude: 0.5,
      frequency: 0.5,
    });
    expect(result.amplitude![1].emphasis).toEqual({
      amplitude: 0.6,
      frequency: 0.5,
    });
  });
});
