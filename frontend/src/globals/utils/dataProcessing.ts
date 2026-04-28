/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {EditorPointData} from '../../state/types';

function findPerpendicularDistance(
  point: EditorPointData,
  line: EditorPointData[],
) {
  const lineStart = {
    x: line[0].x,
    y: line[0].y,
  };
  const lineEnd = {
    x: line[1].x,
    y: line[1].y,
  };
  const slope = (lineEnd.y - lineStart.y) / (lineEnd.x - lineStart.x);
  const intercept = lineStart.y - slope * lineStart.x;
  return (
    Math.abs(slope * point.x - point.y + intercept) / Math.sqrt(slope ** 2 + 1)
  );
}

export function douglasPeucker(
  points: EditorPointData[],
  epsilon: number,
): EditorPointData[] {
  let i;
  let maxIndex = 0;
  let maxDistance = 0;

  // Find the point with the maximum distance
  for (i = 2; i < points.length - 1; i += 1) {
    const perpendicularDistance = findPerpendicularDistance(points[i], [
      points[1],
      points[points.length - 1],
    ]);
    if (perpendicularDistance > maxDistance) {
      maxIndex = i;
      maxDistance = perpendicularDistance;
    }
  }
  // If max distance is greater than epsilon, recursively simplify
  if (maxDistance >= epsilon) {
    const leftRecursiveResults = douglasPeucker(
      points.slice(1, maxIndex),
      epsilon,
    );
    const rightRecursiveResults = douglasPeucker(
      points.slice(maxIndex),
      epsilon,
    );
    return leftRecursiveResults.concat(rightRecursiveResults);
  }

  return points;
}
