/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Konva from 'konva';

import {
  BoundingRect,
  EditorPointData,
  Position,
  SelectionRect,
  TimeLineState,
  RenderMetadata,
} from '../../state/types';
import {BoundingBoxPadding} from '../constants';

/**
 * Convert a position from screen-based coordinates to time-based coordinates relative to the current audio duration
 * x will be clamped between 0 and duration, y between 0 and 1
 * @param mouse The mouse position
 * @param renderMetadata The rendering metadata
 */
export const screenToTime = (
  mouse: Position,
  renderMetadata: RenderMetadata,
): Position => {
  const x =
    (mouse.x / renderMetadata.width) * renderMetadata.duration +
    renderMetadata.startTime;
  const y = 1 - mouse.y / renderMetadata.height;
  return {
    x: Math.max(
      Math.min(x, renderMetadata.startTime + renderMetadata.duration),
      0,
    ),
    y: Math.max(Math.min(y, 1), 0),
  };
};

/**
 * Convert the time-based coordinates relative to the current audio duration to screen-based coordinates
 * @param mouse The mouse position
 * @param renderMetadata The rendering metadata
 */
export const timeToScreen = (
  point: Position,
  renderMetadata: RenderMetadata,
): Position => {
  const x =
    ((point.x - renderMetadata.startTime) / (renderMetadata.duration || 1)) *
    renderMetadata.width;
  const y = (1 - point.y) * renderMetadata.height;
  return {x, y};
};

/**
 * Get the first and last indices of the original `data` array that are included in the `timeline` time slice
 * @param data the data array
 * @param timeline the timeline state
 * @returns An object with `start` and `end`
 */
export function limitsFromTimeline<T extends EditorPointData>(
  data: Array<T>,
  timeline: TimeLineState,
): {start: number; end: number} {
  let start = 0;
  let end = data.length;

  data.some((p, index) => {
    if (p.x < timeline.startTime) {
      start = index;
    }
    if (p.x >= timeline.endTime) {
      end = index;
      return true;
    }
    return false;
  });

  // To avoid having the tail and head being cut too short, we also add two points offscreen
  if (start > 0) start -= 1;
  if (end < data.length) end += 1;

  return {start, end};
}

/**
 * Filters out the initial dataset by returning the set included in the Brush window.
 * To avoid having the head and tail of the plot cut too short, an extra point on the left and right of the window
 * are added. Those points will be rendered offscreen
 * @param data the initial dataset
 * @param brush the brush state
 */
export function filteredDataFromBrush<T extends EditorPointData>(
  data: Array<T>,
  timeline: TimeLineState,
): Array<T> {
  const limits = limitsFromTimeline(data, timeline);
  return data.slice(limits.start, limits.end);
}

/**
 * Use the Konva context to draw a polygon.
 * NOTE: since we are potentially displaying a portion of a line, we'll also need to add two extra points to the LEFT and RIGHT at the bottom of the plot
 * This allows the polygon to be 'closed' without graphical glitches. We need to have a closed polygon to fill it with the gradient
 * @param context the Konva context
 * @param shape the Konva shape object being drawn
 * @param data the starting data
 * @param renderMetadata The rendering metadata
 * @param isClosed determines if the line should closed by adding an extra point to the right
 * @param openingPoint if provided, the polygon will be opened at this point instead of the origin point
 */
export function polygonData(
  context: Konva.Context,
  shape: Konva.Shape,
  data: Array<EditorPointData>,
  renderMetadata: RenderMetadata,
  isClosed = true,
  openingPoint: EditorPointData | undefined = undefined,
): void {
  context.beginPath();
  if (openingPoint) {
    const op = timeToScreen(openingPoint, renderMetadata);
    context.moveTo(op.x, op.y);
  } else if (isClosed) {
    context.moveTo(0, renderMetadata.height);
  }

  let lastPointX = 0;
  data.forEach((point, index) => {
    const p = timeToScreen(point, renderMetadata);
    if (!isClosed && index === 0) {
      context.moveTo(p.x, p.y);
    } else {
      context.lineTo(p.x, p.y);
    }
    lastPointX = p.x;
  });

  if (isClosed) {
    context.lineTo(lastPointX, renderMetadata.height);
    context.closePath();
  }
  if (isClosed) {
    context.fillShape(shape);
  } else {
    context.strokeShape(shape);
  }
}

/**
 * The euclidean distance between two points
 * @param a The first point
 * @param b The second point
 * @returns The distance between the two points
 */
export function euclideanDistance(a: Position, b: Position): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * The euclidean distance between two points, with the x normalized given the window duration
 * @param a The first point
 * @param b The second point
 * @param duration The duration of the current point window
 * @returns The distance between the two points
 */
export function timeNormalizedEuclideanDistance(
  a: Position,
  b: Position,
  duration: number,
): number {
  if (duration === 0) return Number.MAX_SAFE_INTEGER;
  return Math.sqrt(((a.x - b.x) / duration) ** 2 + (a.y - b.y) ** 2);
}

export function linearInterpolationForAxisValue(
  p0: Position,
  p1: Position,
  x: number,
): number {
  if (p0.x === p1.x) return 0;
  return (p0.y * (p1.x - x) + p1.y * (x - p0.x)) / (p1.x - p0.x);
}

/**
 * Check if the selection rect is valid
 * @param rect The selection rect
 * @returns {boolean}
 */
export function isSelectionRectValid(rect?: SelectionRect): boolean {
  return (
    rect !== undefined &&
    rect.x0 !== undefined &&
    rect.x1 !== undefined &&
    rect.y0 !== undefined &&
    rect.y1 !== undefined
  );
}

export function boundingBoxForSelection(
  selection: number[],
  data: EditorPointData[],
  renderMetadata: RenderMetadata,
): BoundingRect | undefined {
  const selectedPoints: Position[] = [];
  let pointCount = 0;

  if (selection.length > 0 && data.length > 0) {
    selection.forEach(p => {
      if (data[0]) {
        const relativeIndex = p - data[0].index;

        if (data[relativeIndex]) {
          pointCount += 1;
          selectedPoints.push(
            timeToScreen(data[relativeIndex], renderMetadata),
          );
          if (data[relativeIndex].emphasis) {
            selectedPoints.push(
              timeToScreen(
                {
                  x: data[relativeIndex].x,
                  y: data[relativeIndex].emphasis?.y || 0,
                },
                renderMetadata,
              ),
            );
          }
        }
      }
    });
  }

  if (pointCount > 1) {
    return {
      x0: Math.min(...selectedPoints.map(p => p.x)) - BoundingBoxPadding,
      x1: Math.max(...selectedPoints.map(p => p.x)) + BoundingBoxPadding,
      y0: Math.min(...selectedPoints.map(p => p.y)) - BoundingBoxPadding,
      y1: Math.max(...selectedPoints.map(p => p.y)) + BoundingBoxPadding,
    };
  }
  return undefined;
}
