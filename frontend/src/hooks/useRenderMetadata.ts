/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {useMemo} from 'react';
import Constants from '../globals/constants';
import {RenderMetadata, TimeLineState} from '../state/types';

interface UseRenderMetadataOptions {
  /**
   * When true, only subtracts top margin from height (not bottom).
   * Used for overlay components like PasteEditor that need different sizing.
   */
  excludeBottomMargin?: boolean;
}

/**
 * Custom hook that computes render metadata for canvas-based components.
 *
 * @param width - The container width in pixels
 * @param height - The container height in pixels
 * @param timeline - The current timeline state with start/end times
 * @param options - Optional configuration for margin handling
 * @returns RenderMetadata object with computed dimensions and timing info
 */
export function useRenderMetadata(
  width: number,
  height: number,
  timeline: TimeLineState,
  options: UseRenderMetadataOptions = {},
): RenderMetadata {
  const {excludeBottomMargin = false} = options;

  return useMemo(() => {
    const computedWidth =
      width - Constants.plot.margin.left - Constants.plot.margin.right;

    const computedHeight = excludeBottomMargin
      ? height - Constants.plot.margin.top
      : height - Constants.plot.margin.top - Constants.plot.margin.bottom;

    return {
      width: computedWidth,
      height: computedHeight,
      duration: timeline.endTime - timeline.startTime,
      startTime: timeline.startTime,
      margin: Constants.plot.margin,
    };
  }, [
    width,
    height,
    timeline.endTime,
    timeline.startTime,
    excludeBottomMargin,
  ]);
}
