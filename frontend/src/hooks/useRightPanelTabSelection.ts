/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {useEffect} from 'react';
import {useDispatch} from 'react-redux';
import {Clip, RightPanelSection} from '../state/types';
import {AnyAction} from 'redux';

interface UseRightPanelTabSelectionParams {
  /** The current clip, or undefined if no clip is selected */
  currentClip: Clip | undefined;
  /** Array of selected breakpoint indices */
  selectedBreakpoints: number[] | undefined;
  /** Array of all clip IDs in the project */
  clipIds: string[];
  /** The currently selected clip ID */
  currentClipId: string | undefined;
  /** Action creator for setting the right panel item */
  setRightPanelItem: (params: {item: RightPanelSection}) => AnyAction;
}

/**
 * Determines the appropriate tab to display based on the current state.
 *
 * @param currentClip - The current clip
 * @returns The appropriate RightPanelSection
 */
function determineActiveTab(currentClip: Clip | undefined): RightPanelSection {
  if (!currentClip) {
    return RightPanelSection.Design;
  }

  if (currentClip.failed) {
    return RightPanelSection.Analysis;
  }

  if (!currentClip.audio?.path) {
    return RightPanelSection.Design;
  }

  if (currentClip.audio?.path && currentClip.audio.exists) {
    return RightPanelSection.Analysis;
  }

  return RightPanelSection.Design;
}

/**
 * Custom hook that manages the automatic tab selection logic for the RightPanel.
 *
 * - When clipIds becomes empty → switch to Design
 * - When currentClip changes → determine the appropriate tab based on clip state
 * - When selectedBreakpoints changes → switch to Design
 *
 * @param params - The hook parameters
 */
export function useRightPanelTabSelection({
  currentClip,
  selectedBreakpoints,
  clipIds,
  currentClipId,
  setRightPanelItem,
}: UseRightPanelTabSelectionParams): void {
  const dispatch = useDispatch();

  // When there are no clips, switch to Design tab
  useEffect(() => {
    if (clipIds.length === 0) {
      dispatch(setRightPanelItem({item: RightPanelSection.Design}));
    }
  }, [clipIds, dispatch, setRightPanelItem]);

  // When the current clip changes, determine the appropriate tab
  // Note: We intentionally only depend on currentClipId, not currentClip.
  // If we depended on currentClip, the effect would fire whenever any clip property
  // changes (e.g., adding a marker, editing amplitude), which would reset the user's
  // tab selection unexpectedly.
  useEffect(() => {
    const nextSection = determineActiveTab(currentClip);
    dispatch(setRightPanelItem({item: nextSection}));
  }, [currentClipId, dispatch, setRightPanelItem]);

  // When breakpoints are selected, switch to Design tab
  useEffect(() => {
    if (selectedBreakpoints?.length) {
      dispatch(setRightPanelItem({item: RightPanelSection.Design}));
    }
  }, [selectedBreakpoints, dispatch, setRightPanelItem]);
}
