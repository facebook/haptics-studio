/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {useRef} from 'react';
import {MinimumTimeSpacing} from '../globals/constants';
import {PointType} from '../components/editor/envelope/EditablePoints';
import {frequencyForSharpness} from '../globals/utils';
import {EditorPointData, EmphasisType} from '../state/types';

/**
 * Shallow-clone an EditorPointData, including its optional emphasis.
 */
function clonePoint(point: EditorPointData): EditorPointData {
  return {
    ...point,
    emphasis: point.emphasis ? {...point.emphasis} : undefined,
  };
}

export interface PointMovementHook {
  movePoints: (
    points: EditorPointData[],
    duration: number,
    selection: number[],
    deltaX: number,
    deltaY: number,
    pointType: PointType,
    isHoldingShift: boolean,
    ignoreShift: boolean,
  ) => EditorPointData[];
  onScaleBegin: (points: EditorPointData[], selection: number[]) => void;
  scalePoints: (
    points: EditorPointData[],
    selection: number[],
    movementY: number,
    anchor: PointType.ScaleAnchorDown | PointType.ScaleAnchorUp,
  ) => EditorPointData[];
  onMovementMouseUp: () => void;
}

interface Elevations {
  y: number;
  index: number;
}

interface ScaleState {
  original: EditorPointData[];
  delta: number;
  lowerPoint: Elevations;
  upperPoint: Elevations;
}

/**
 * Keeps the brush scrolling state and handles the mouse input
 */
export default function usePointMovement(): PointMovementHook {
  const overflow = useRef<{x: number; y: number}>({x: 0, y: 0});
  const scaleState = useRef<ScaleState>();

  /**
   * Mouse up event
   */
  const onMovementMouseUp = () => {
    overflow.current = {x: 0, y: 0};
    scaleState.current = undefined;
  };

  /**
   * Move the selected points by a delta in both axis, while keeping the waveform shape.
   * @param points the sub-dataset to move
   * @param duration the file duration in seconds
   * @param selection the selected indexes
   * @param movementX the amount of movement on the X axis
   * @param movementY the amount of movement on the Y axis
   * @param pointType the type of point (data or emphasis)
   * @param isHoldingShift the state of the shift key
   * @param ignoreShift boolean that ignores the shift key
   */
  const movePoints = (
    points: EditorPointData[],
    duration: number,
    selection: number[],
    movementX: number,
    movementY: number,
    pointType: PointType,
    isHoldingShift: boolean,
    ignoreShift: boolean,
  ) => {
    /**
     * Note: To keep the waveform shape when one or more points hit a boundary we proceed by moving the dataset by the given amount, then we go through the new positions to
     * determine whether one or more points hit a hard limit (either the Y value or the X position of a neighbor), in which case the dataset is moved back only by the exceeding amount.
     * While semantically cumbersome this approach is required since points have a reciprocal spatial relationship (e.g. p1.x can't be greater than p2.x) and the user can select
     * a non contiguous set of points, so an approach where we just
     * stop before hitting a constraint won't work.
     */

    const newData = [...points];

    let deltaX = movementX;
    let deltaY = movementY;
    if (pointType === PointType.EmphasisBody) {
      deltaY = 0;
    }
    const currentOverflow = {...overflow.current};

    // Subtract the delta from the overflow. If the overflow is less than the delta, resize the delta instead
    if (Math.abs(currentOverflow.x) >= Math.abs(deltaX)) {
      currentOverflow.x = overflow.current.x - deltaX;
      deltaX = 0;
    } else {
      deltaX -= currentOverflow.x;
      currentOverflow.x = 0;
    }

    if (Math.abs(currentOverflow.y) >= Math.abs(deltaY)) {
      currentOverflow.y = overflow.current.y - deltaY;
      deltaY = 0;
    } else {
      deltaY -= currentOverflow.y;
      currentOverflow.y = 0;
    }

    if (pointType !== PointType.BoundingBox) {
      // Moving a single point
      const index = selection[0];
      const relativeIndex = index - points[0].index;
      const point: EditorPointData = newData[relativeIndex];
      // If moving emphasis, we'll move emphasis points only, leave other intact if they were caught up in the selection
      if (
        point &&
        (pointType === PointType.Data ||
          pointType === PointType.EmphasisBody ||
          (pointType === PointType.Emphasis && point && point.emphasis))
      ) {
        // Find the horizontal bounds (the previous and next point in the dataset), to limit the x movement
        const x = isHoldingShift && !ignoreShift ? point.x : point.x + deltaX;
        // Note: since the canvas uses mirrored coordinates, we use -deltaY instead
        if (
          pointType === PointType.Data ||
          pointType === PointType.EmphasisBody
        ) {
          // Normal movement. Check against the emphasis point, if present. It'll act as a hard limit for the Y coord
          const y = point.y - deltaY;
          newData[relativeIndex] = {...newData[relativeIndex], x, y, index};
        } else if (pointType === PointType.Emphasis) {
          // Emphasis movement, it will drag the amplitude down if needed
          const empY = (point.emphasis?.y || 0) - deltaY;
          const y = Math.min(point.y, empY);
          newData[relativeIndex] = {
            x,
            y,
            index,
            emphasis: {
              y: empY,
              frequency:
                newData[relativeIndex].emphasis?.frequency ||
                frequencyForSharpness(EmphasisType.Medium),
            },
          };
        }
      }
    } else {
      // Move a whole bounding box
      selection.forEach(index => {
        // `index` is referring to the position in the complete dataset, we want to scale it to the current slice:
        const relativeIndex = index - points[0].index;
        if (relativeIndex < 0 || relativeIndex >= newData.length) return;
        const point: EditorPointData = newData[relativeIndex];

        // Find the horizontal bounds (the previous and next point in the dataset), to limit the x movement
        const x = isHoldingShift && !ignoreShift ? point.x : point.x + deltaX;
        if (point.emphasis) {
          const empY = (point.emphasis?.y || 0) - deltaY;
          const y = point.y - deltaY;
          newData[relativeIndex] = {
            x,
            y,
            index,
            emphasis: {
              y: empY,
              frequency:
                newData[relativeIndex].emphasis?.frequency ||
                frequencyForSharpness(EmphasisType.Medium),
            },
          };
        } else {
          const y = point.y - deltaY;
          newData[relativeIndex] = {...newData[relativeIndex], x, y, index};
        }
      });
    }

    // Check limit violations
    const limitOverflow = {x: 0, y: 0};

    selection.forEach(index => {
      const relativeIndex = index - points[0].index;
      if (relativeIndex < 0 || relativeIndex >= newData.length) return;
      const point: EditorPointData = newData[relativeIndex];

      // Find the horizontal bounds (the previous and next point in the dataset), to limit the x movement
      const previousTime = relativeIndex > 0 ? newData[relativeIndex - 1].x : 0;
      const nextTime =
        relativeIndex < newData.length - 1
          ? newData[relativeIndex + 1].x
          : duration;

      // The first point can't move at all
      if (index === 0) {
        limitOverflow.x = -point.x;
      } else {
        // The point hit the next point
        if (point.x > nextTime - MinimumTimeSpacing) {
          limitOverflow.x = -Math.max(
            Math.abs(limitOverflow.x),
            Math.abs(nextTime - MinimumTimeSpacing - point.x),
          );
        }
        // The point hit the previous point
        if (point.x < previousTime + MinimumTimeSpacing) {
          limitOverflow.x = Math.max(
            Math.abs(limitOverflow.x),
            Math.abs(previousTime + MinimumTimeSpacing - point.x),
          );
        }
      }
      if (pointType === PointType.Data || pointType === PointType.BoundingBox) {
        const upperLimit = point.emphasis ? point.emphasis?.y || 1 : 1;

        // The point hit the lower bound
        if (point.y < 0) {
          limitOverflow.y = Math.max(
            Math.abs(limitOverflow.y),
            Math.abs(point.y),
          );
        }
        // The point hit the upper bound
        if (point.y > upperLimit) {
          limitOverflow.y = -Math.max(
            Math.abs(limitOverflow.y),
            Math.abs(point.y - upperLimit),
          );
        }
        if (pointType === PointType.BoundingBox && point.emphasis) {
          // The emphasis point hit the lower bound
          if ((point.emphasis?.y || 0) < 0) {
            limitOverflow.y = Math.max(
              Math.abs(limitOverflow.y),
              Math.abs(point.emphasis?.y || 0),
            );
          }
          // The emphasis point hit the upper bound
          if ((point.emphasis?.y || 0) > 1) {
            limitOverflow.y = -Math.max(
              Math.abs(limitOverflow.y),
              Math.abs((point.emphasis?.y || 0) - 1),
            );
          }
        }
      } else if (pointType === PointType.Emphasis || point.emphasis) {
        // The emphasis point hit the lower bound
        if ((point.emphasis?.y || 0) < 0) {
          limitOverflow.y = Math.max(
            Math.abs(limitOverflow.y),
            Math.abs(point.emphasis?.y || 0),
          );
        }
        // The emphasis point hit the upper bound
        if ((point.emphasis?.y || 0) > 1) {
          limitOverflow.y = -Math.max(
            Math.abs(limitOverflow.y),
            Math.abs((point.emphasis?.y || 0) - 1),
          );
        }
      }
    });

    // Adjust points
    if (limitOverflow.x !== 0 || limitOverflow.y !== 0) {
      selection.forEach(index => {
        // `index` is referring to the position in the complete dataset, we want to scale it to the current slice:
        const relativeIndex = index - points[0].index;
        if (relativeIndex < 0 || relativeIndex >= newData.length) return;
        const point: EditorPointData = clonePoint(newData[relativeIndex]);

        if (
          pointType === PointType.Data ||
          pointType === PointType.EmphasisBody ||
          pointType === PointType.BoundingBox
        ) {
          point.y += limitOverflow.y;
          point.x += limitOverflow.x;
          if (pointType === PointType.BoundingBox && point.emphasis) {
            if (limitOverflow.y > 0 && point.y <= 0) {
              point.y = Math.min(point.y + limitOverflow.y, 0);
            }
            point.emphasis.y += limitOverflow.y;
          }
        } else if (pointType === PointType.Emphasis && point.emphasis) {
          if (limitOverflow.y > 0 && point.y <= 0) {
            point.y = Math.min(point.y + limitOverflow.y, 0);
          }
          point.emphasis.y += limitOverflow.y;
          point.x += limitOverflow.x;
        }
        if (index === 0) {
          point.x = 0;
        }
        newData[relativeIndex] = point;
      });
    }
    overflow.current = {
      x: currentOverflow.x + limitOverflow.x,
      y: currentOverflow.y - limitOverflow.y,
    };

    return newData;
  };

  /**
   * Begin the scale action. This will store the selected waveform "shape", so that it won't get destroyed by the scaling operations
   * @param points the dataset
   * @param selection the selection indices
   */
  const onScaleBegin = (points: EditorPointData[], selection: number[]) => {
    const selectedPoints: EditorPointData[] = [];
    // Get the selected points to select the upper and lower points
    selection.forEach(index => {
      const relativeIndex = index - points[0].index;

      if (points[relativeIndex].emphasis) {
        selectedPoints.push({
          ...points[relativeIndex],
          emphasis: {...points[relativeIndex].emphasis!},
        });
      } else {
        selectedPoints.push({...points[relativeIndex]});
      }
    });

    const elevations: Elevations[] = [];
    selectedPoints.forEach(p => {
      elevations.push({y: p.y, index: p.index});
      if (p.emphasis) {
        elevations.push({y: p.emphasis.y, index: p.index});
      }
    });
    const sorted = elevations.sort((a, b) => a.y - b.y);
    const upperPoint = sorted[sorted.length - 1];
    const lowerPoint = sorted[0];
    const delta = upperPoint.y - lowerPoint.y;

    scaleState.current = {
      original: [...selectedPoints],
      delta,
      lowerPoint: {...lowerPoint},
      upperPoint: {...upperPoint},
    };
  };

  /**
   * Scale the selected points by a delta, while keeping the waveform shape.
   * @param points the sub-dataset to move
   * @param selection the selected indexes
   * @param movementY the amount of movement on the Y axis
   * @param anchor the scale direction. `scaleAnchorDown` means that the lower point will remain anchored, `scaleAnchorUp` will anchor the top one (or the emphasis, if present)
   */
  const scalePoints = (
    points: EditorPointData[],
    selection: number[],
    movementY: number,
    anchor: PointType.ScaleAnchorDown | PointType.ScaleAnchorUp,
  ): EditorPointData[] => {
    if (scaleState.current === undefined) return [...points];

    const newData = [...points];

    let deltaY = movementY;
    const currentOverflow = {...overflow.current};

    currentOverflow.x = 0;

    if (Math.abs(currentOverflow.y) >= Math.abs(deltaY)) {
      currentOverflow.y = overflow.current.y - deltaY;
      deltaY = 0;
    } else {
      deltaY -= currentOverflow.y;
      currentOverflow.y = 0;
    }

    const limitOverflow = {x: 0, y: 0};

    const currentUpperPointY = newData[
      scaleState.current.upperPoint.index - newData[0].index
    ].emphasis
      ? newData[scaleState.current.upperPoint.index - newData[0].index]
          .emphasis!.y
      : newData[scaleState.current.upperPoint.index - newData[0].index].y;

    if (
      currentUpperPointY - deltaY > 1 &&
      anchor === PointType.ScaleAnchorDown
    ) {
      limitOverflow.y = 1 - (currentUpperPointY - deltaY);
      deltaY = currentUpperPointY - 1;
    }

    const currentLowerPointY =
      newData[scaleState.current.lowerPoint.index - newData[0].index].y;
    if (currentLowerPointY - deltaY < 0 && anchor === PointType.ScaleAnchorUp) {
      limitOverflow.y = -(currentLowerPointY - deltaY);
      deltaY = currentLowerPointY;
    }

    const currentDelta = currentUpperPointY - currentLowerPointY;
    const newDelta =
      anchor === PointType.ScaleAnchorDown
        ? currentDelta - deltaY
        : currentDelta + deltaY;

    if (newDelta <= 0) {
      overflow.current = {
        x: currentOverflow.x,
        y: currentOverflow.y + newDelta,
      };
      return [...newData];
    }

    // Move the points
    selection.forEach((index, i) => {
      if (scaleState.current === undefined) return;

      // `index` is referring to the position in the complete dataset, we want to scale it to the current slice:
      const relativeIndex = index - points[0].index;
      if (relativeIndex < 0 || relativeIndex >= newData.length) return;
      const point: EditorPointData = clonePoint(newData[relativeIndex]);

      if (
        scaleState.current.original[i].y === scaleState.current.upperPoint.y &&
        anchor === PointType.ScaleAnchorDown
      ) {
        // Moving the top most point (no emphasis), we just move that point by the delta mouse movement
        point.y -= deltaY;
        if (point.emphasis) {
          point.emphasis.y -= deltaY;
        }
      } else if (
        scaleState.current.original[i].emphasis &&
        scaleState.current.original[i].emphasis!.y ===
          scaleState.current.upperPoint.y &&
        anchor === PointType.ScaleAnchorDown
      ) {
        // Moving the top most point, when the point is an emphasis point, we move the emphasis by the delta, and scale the point attached accordingly
        point.emphasis!.y -= deltaY;
        if (
          point.index !== scaleState.current.lowerPoint.index &&
          scaleState.current.delta > 0
        ) {
          const originalPosition =
            (scaleState.current.original[i].y -
              scaleState.current.lowerPoint.y) /
            scaleState.current.delta;
          point.y =
            scaleState.current.lowerPoint.y + newDelta * originalPosition;
        }
      } else if (
        scaleState.current.original[i].y === scaleState.current.lowerPoint.y &&
        anchor === PointType.ScaleAnchorUp
      ) {
        // Moving the bottom point, we just move that point by the delta mouse movement
        point.y -= deltaY;
        if (
          point.emphasis &&
          scaleState.current.original[i].emphasis &&
          scaleState.current.delta > 0
        ) {
          const originalPosition =
            (scaleState.current.original[i].emphasis!.y -
              scaleState.current.lowerPoint.y) /
            scaleState.current.delta;
          point.emphasis.y =
            scaleState.current.upperPoint.y - newDelta * (1 - originalPosition);
        }
      } else if (scaleState.current.delta > 0) {
        // Scale all other points by getting a reference to their initial relative position between upperPoint - lowerPoint, and scaling it with the new span
        const originalPosition =
          (scaleState.current.original[i].y - scaleState.current.lowerPoint.y) /
          scaleState.current.delta;
        if (anchor === PointType.ScaleAnchorDown) {
          point.y =
            scaleState.current.lowerPoint.y + newDelta * originalPosition;
        } else {
          point.y =
            scaleState.current.upperPoint.y - newDelta * (1 - originalPosition);
        }
        if (
          anchor === PointType.ScaleAnchorDown &&
          point.emphasis &&
          scaleState.current.original[i].emphasis
        ) {
          const originalPosition =
            (scaleState.current.original[i].emphasis!.y -
              scaleState.current.lowerPoint.y) /
            scaleState.current.delta;
          point.emphasis.y =
            scaleState.current.lowerPoint.y + newDelta * originalPosition;
        }
        if (
          anchor === PointType.ScaleAnchorUp &&
          point.emphasis &&
          scaleState.current.original[i].emphasis
        ) {
          const originalPosition =
            (scaleState.current.original[i].emphasis!.y -
              scaleState.current.lowerPoint.y) /
            scaleState.current.delta;
          point.emphasis.y =
            scaleState.current.upperPoint.y - newDelta * (1 - originalPosition);
        }
      }
      newData[relativeIndex] = point;
    });

    overflow.current = {
      x: currentOverflow.x + limitOverflow.x,
      y: currentOverflow.y - limitOverflow.y,
    };

    return newData;
  };

  return {movePoints, onScaleBegin, scalePoints, onMovementMouseUp};
}
