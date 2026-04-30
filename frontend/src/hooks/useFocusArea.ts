/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {useCallback} from 'react';
import {useDispatch} from 'react-redux';
import actions from '../state/actions';
import selectors from '../state/app/selectors';
import {FocusArea} from '../state/types';

/**
 * Hook that provides focus area management functionality.
 *
 * @param targetArea - The FocusArea to focus when the callback is invoked
 * @returns An object containing:
 *   - focus: The current focus area
 *   - isFocused: Whether the target area is currently focused
 *   - setFocus: Callback to set focus to the target area (only dispatches if not already focused)
 *
 * @example
 * // Basic usage
 * const {isFocused, setFocus} = useFocusArea(FocusArea.Navigator);
 * <div onMouseDown={setFocus} className={isFocused ? 'focused' : ''} />
 *
 * @example
 * // With conditional focus check
 * const {focus, setFocus} = useFocusArea(FocusArea.Plot);
 * if (focus === FocusArea.Plot) {
 *   // Handle plot-specific keyboard events
 * }
 */
export function useFocusArea(targetArea: FocusArea) {
  const dispatch = useDispatch();
  const focus = selectors.getFocus();

  const isFocused = focus === targetArea;

  const setFocus = useCallback(() => {
    if (focus !== targetArea) {
      dispatch(actions.app.setFocusArea({focus: targetArea}));
    }
  }, [dispatch, focus, targetArea]);

  return {
    focus,
    isFocused,
    setFocus,
  };
}

/**
 * Hook that provides a simple focus callback without returning the current focus state.
 * Use this when you only need the callback and don't need to check current focus.
 *
 * @param targetArea - The FocusArea to focus when the callback is invoked
 * @returns A memoized callback to set focus to the target area
 *
 * @example
 * const onNavigatorFocus = useFocusAreaCallback(FocusArea.Navigator);
 * <div onMouseDown={onNavigatorFocus} />
 */
export function useFocusAreaCallback(targetArea: FocusArea) {
  const dispatch = useDispatch();
  const focus = selectors.getFocus();

  return useCallback(() => {
    if (focus !== targetArea) {
      dispatch(actions.app.setFocusArea({focus: targetArea}));
    }
  }, [dispatch, focus, targetArea]);
}

export default useFocusArea;
