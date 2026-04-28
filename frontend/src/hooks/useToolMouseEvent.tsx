/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {AppContext} from '../containers/App';
import {Tool} from '../state/editingTools/types';

/**
 * Attach a mouse event to the window and perform a callback with the event
 * The event is ignored if the active tool is not in the list of allowed tools
 * @param allowed a list of tool that can respond to the event
 * @param event the event to tap
 * @param callback the function called when the event fires
 */
export const useToolMouseEvent = (
  allowed: Tool[],
  event: 'mouseup' | 'mousedown' | 'mousemove' | 'mouseleave' | 'mouseenter',
  callback: (event: MouseEvent) => void,
): void => {
  const {selectors} = React.useContext(AppContext);
  const activeTool = selectors.editingTools.getActiveTool();

  return React.useEffect(() => {
    if (!allowed.includes(activeTool)) {
      return;
    }
    window.addEventListener(event, callback);
    return () => window.removeEventListener(event, callback);
  }, [event, callback, activeTool]);
};
