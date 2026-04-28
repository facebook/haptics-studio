/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {useEffect} from 'react';

/**
 * Attach a mouse event to the window and perform a callback with the event
 * @param event the event to tap
 * @param callback the function called when the event fires
 */
export const useMouseEvent = (
  event:
    | 'mouseup'
    | 'mousedown'
    | 'mousemove'
    | 'mouseleave'
    | 'mouseenter'
    | 'dblclick',
  callback: (event: MouseEvent) => void,
): void => {
  return useEffect(() => {
    window.addEventListener(event, callback);
    return () => window.removeEventListener(event, callback);
  }, [event, callback]);
};
