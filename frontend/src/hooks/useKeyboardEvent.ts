/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {useEffect} from 'react';

/**
 * Attach a keyboard event to the window and performa a callback with the evennt
 * @param event the event to tap
 * @param callback the function called when the event fires
 */
export const useKeyboardEvent = (
  event: 'keydown' | 'keyup',
  callback: (event: KeyboardEvent) => void,
): void => {
  return useEffect(() => {
    window.addEventListener(event, callback);
    return () => window.removeEventListener(event, callback);
  }, [event, callback]);
};
