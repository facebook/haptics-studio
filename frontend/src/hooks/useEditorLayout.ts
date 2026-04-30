/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {useCallback, useLayoutEffect, RefObject} from 'react';
import Constants from '../globals/constants';
import {Size} from '../state/types';

interface UseEditorLayoutParams {
  /** Ref to the container element */
  containerRef: RefObject<HTMLDivElement | undefined>;
  /** Width of the right panel */
  rightPanelWidth: number;
  /** Width of the left panel */
  leftPanelWidth: number;
  /** Callback to update the size state */
  onSizeChange: (size: Size) => void;
  /** Callback to update the editor width (used by brush state) */
  setEditorWidth: (width: number) => void;
}

/**
 * Custom hook that manages the editor layout sizing and resize handling.
 *
 * - Calculates the plot width based on container dimensions
 * - Handles window resize events
 * - Updates sizes when panel widths change
 *
 * @param params - The hook parameters
 * @returns Object containing the recalculatePlotWidth function
 */
export function useEditorLayout({
  containerRef,
  rightPanelWidth,
  leftPanelWidth,
  onSizeChange,
  setEditorWidth,
}: UseEditorLayoutParams): {
  recalculatePlotWidth: () => void;
} {
  const calculatePlotWidth = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const w = (container.clientWidth || 0) - (container.clientLeft || 0);
    const h = container.clientHeight || 0;

    onSizeChange({w, h});
    setEditorWidth(
      w - Constants.plot.margin.left - Constants.plot.margin.right,
    );
  }, [containerRef, onSizeChange, setEditorWidth]);

  // Set up resize listener and recalculate on panel width changes
  useLayoutEffect(() => {
    calculatePlotWidth();
    window.addEventListener('resize', calculatePlotWidth);
    return () => {
      window.removeEventListener('resize', calculatePlotWidth);
    };
  }, [rightPanelWidth, leftPanelWidth]);

  return {
    recalculatePlotWidth: calculatePlotWidth,
  };
}
