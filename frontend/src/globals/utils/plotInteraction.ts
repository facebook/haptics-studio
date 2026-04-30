/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  AdjacentPoints,
  EditorPointData,
  PlotHoverState,
  Position,
  RenderMetadata,
} from '../../state/types';
import {MinimumTimeSpacing} from '../constants';
import {
  euclideanDistance,
  linearInterpolationForAxisValue,
  screenToTime,
  timeNormalizedEuclideanDistance,
  timeToScreen,
} from './coordinates';

/**
 * Calculate the hover state of the mouse on the plot. This finds the ghost point and the point closest to the mouse
 * @param mousePosition the mouse coordinates
 * @param data the dataset
 * @param renderMetadata The rendering metadata
 * @param matchTolerance the tolerance used in searching for the matching horizontal point
 * @returns `PlotHoverState`
 */
export function plotHoverState(
  mousePosition: Position,
  data: EditorPointData[],
  renderMetadata: RenderMetadata,
  matchTolerance: number,
): PlotHoverState {
  // Mouse is in screen coordinates, convert the coordinates domain to time and amplitude
  const mouseTime = screenToTime(mousePosition, renderMetadata);
  const hoverRadiusTolreance = 0.01;

  const adjacentPoints = findAdjacentPoints(data, mouseTime.x, matchTolerance);
  let closestPointHorizontally: EditorPointData | undefined;
  if (adjacentPoints.match) {
    closestPointHorizontally = adjacentPoints.match;
  } else if (adjacentPoints.left && adjacentPoints.right) {
    // Find the closest point horizontally
    const leftDistance = Math.abs(mouseTime.x - adjacentPoints.left.x);
    const rightDistance = Math.abs(mouseTime.x - adjacentPoints.right.x);
    closestPointHorizontally =
      leftDistance < rightDistance ? adjacentPoints.left : adjacentPoints.right;
  } else if (adjacentPoints.left) {
    closestPointHorizontally = adjacentPoints.left;
  } else if (adjacentPoints.right) {
    closestPointHorizontally = adjacentPoints.right;
  }

  const closestEmphasis = [
    adjacentPoints.match,
    adjacentPoints.left,
    adjacentPoints.right,
  ]
    .filter(p => p && p.emphasis)
    .map(p => p?.index) as number[];

  // Holds the index of the point closest to the mouse
  const closestPointsWindow: EditorPointData[] = [];
  let hoveredPointIndex: number | undefined;
  if (
    data.length > 0 &&
    mousePosition &&
    mouseTime !== undefined &&
    closestPointHorizontally
  ) {
    // Show the hover only when the mouse is above the canvas
    if (
      mousePosition.x >= 0 &&
      mousePosition.x <= renderMetadata.width &&
      mousePosition.y >= 0 &&
      mousePosition.y <= renderMetadata.height
    ) {
      // closest.index is relative to the whole dataset, subtracting `data[0].index` scales it down to the current timeline window, since data[0] is the first visible point
      const scaledIndex = closestPointHorizontally.index - data[0].index;

      /* NOTE: while using only X to find the hover point works fine with a fairly flat envelope, the selection is cumbersome
        when there are multiple points near peaks or valleys. To fix this we use the two points around the closest one,
        evaluate the euclidean distance, and pick the closest in both dimensions. */
      if (scaledIndex > 0) {
        closestPointsWindow.push(data[scaledIndex - 1]);
      }
      closestPointsWindow.push(data[scaledIndex]);
      if (scaledIndex < data.length - 1) {
        closestPointsWindow.push(data[scaledIndex + 1]);
      }

      const closestPoint = closestPointsWindow.sort(
        (a, b) =>
          euclideanDistance(mouseTime, a) - euclideanDistance(mouseTime, b),
      )[0];

      if (
        timeNormalizedEuclideanDistance(
          mouseTime,
          closestPoint,
          renderMetadata.duration,
        ) <= hoverRadiusTolreance
      ) {
        hoveredPointIndex = closestPoint.index;
      }
    }
  }

  return {
    adjacentPoints,
    closestPoints: new Set(closestPointsWindow.map(p => p.index)),
    closestEmphasis,
    hoveredPointIndex,
  };
}

export function newEmphasisPointData(
  hoverState: PlotHoverState,
  cursor: Position,
): EditorPointData | undefined {
  const {adjacentPoints} = hoverState;
  if (adjacentPoints.match) {
    if (cursor.y > adjacentPoints.match.y) {
      return {...adjacentPoints.match, emphasis: {y: cursor.y, frequency: 1}};
    } else {
      return {
        ...adjacentPoints.match,
        y: cursor.y,
        emphasis: {y: cursor.y, frequency: 1},
      };
    }
  } else if (adjacentPoints.left && adjacentPoints.right) {
    // Get the interpolated value between the two points where cursor intersects
    const interpolatedY = linearInterpolationForAxisValue(
      {x: adjacentPoints.left.x, y: adjacentPoints.left.y},
      {x: adjacentPoints.right.x, y: adjacentPoints.right.y},
      cursor.x,
    );
    if (cursor.y > interpolatedY) {
      return {
        index: -1,
        x: cursor.x,
        y: interpolatedY,
        emphasis: {y: cursor.y, frequency: 1},
      };
    } else {
      return {
        index: -1,
        x: cursor.x,
        y: cursor.y,
        emphasis: {y: cursor.y, frequency: 1},
      };
    }
  } else if (adjacentPoints.left) {
    if (cursor.y > adjacentPoints.left.y) {
      return {
        x: cursor.x,
        y: adjacentPoints.left.y,
        index: -1,
        emphasis: {y: cursor.y, frequency: 1},
      };
    } else {
      return {
        ...adjacentPoints.left,
        x: cursor.x,
        index: -1,
        y: cursor.y,
        emphasis: {y: cursor.y, frequency: 1},
      };
    }
  }
  return undefined;
}

/**
 * Find the two adjacent points to a given time. Returns a `left` and `right` point which represent the
 * point before and after `time`. If one of the points is not found, it is set to `undefined`.
 * If the time matches a point, within the tolerance, the point is returned as `match`.
 * @param data the data to search in
 * @param time the time to search for
 * @param matchTolerance the tolerance to consider when matching the central point
 * @param range the range to search in (index values), if not provided, the whole data is searched
 * @returns the points before and after the time, if found, undefined otherwise. If the time matches a point, within the tolerance, the point is returned as `middle`.
 */
export const findAdjacentPoints = (
  data: EditorPointData[],
  time: number,
  matchTolerance?: number,
  range?: {start?: number; end?: number},
): AdjacentPoints => {
  const tolerance = matchTolerance ?? MinimumTimeSpacing;

  if (data.length === 0)
    return {left: {x: 0, y: 0, index: 0}, right: undefined, match: undefined};
  if (data.length === 1)
    return {left: data[0], right: undefined, match: undefined};
  if (time <= 0) return {left: undefined, right: data[1], match: data[0]};

  const {start = 0, end = data.length - 1} = range ?? {};

  if (start >= end)
    return {left: undefined, right: undefined, match: undefined};

  // Time is beyond the envelope duration, return the last point as left, or the match and the second to last point as left
  if (time >= data[end].x) {
    const hasMatch = Math.abs(time - data[end].x) < tolerance;
    return {
      left: hasMatch ? data[end - 1] : data[end],
      right: undefined,
      match: hasMatch ? data[end] : undefined,
    };
  }

  const mid = Math.floor((start + end) / 2);

  // If the time matches a point, within the tolerance, return the point and the two adjacent points
  if (Math.abs(time - data[mid].x) <= tolerance) {
    let left = mid;
    let right = mid;

    if (mid < data.length - 1) {
      right = mid + 1;
    }
    if (mid > 0) {
      left = mid - 1;
    }
    return {left: data[left], right: data[right], match: data[mid]};
  }

  if (time > data[mid].x && time < data[mid + 1].x) {
    return {left: data[mid], right: data[mid + 1], match: undefined};
  } else if (time < data[mid].x) {
    return findAdjacentPoints(data, time, matchTolerance, {start, end: mid});
  } else {
    return findAdjacentPoints(data, time, matchTolerance, {start: mid, end});
  }
};

/**
 * Find the point with the vertical position to snap the pen tool to, given a mouse position
 * @param data The data to search in
 * @param mousePosition The current mouse position
 * @param renderMetadata: RenderMetadata
 * @returns The point to snap to, or undefined if no point was found
 */
export const snapPointInData = (
  data: EditorPointData[],
  mousePosition: Position,
  renderMetadata: RenderMetadata,
): Position | undefined => {
  if (!mousePosition || data.length === 0) return undefined;

  const lastPointTime = data[data.length - 1].x;
  const cursorTime = screenToTime(mousePosition, renderMetadata);
  if (cursorTime.x < lastPointTime) return undefined;

  for (let i = data.length - 1; i >= 0; i -= 1) {
    const {y} = data[i];

    if (cursorTime.y >= y - 0.01 && cursorTime.y <= y + 0.01) {
      return timeToScreen(data[i], renderMetadata);
    }
  }
  return undefined;
};
