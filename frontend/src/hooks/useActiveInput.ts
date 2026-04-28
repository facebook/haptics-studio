/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';

/**
 * Hook that tracks if the user is currently typing in an input field.
 * @param onFocus callback when a field is focused
 * @param onBlur callback when the field focus is released
 */
const useActiveInput = (onFocus: () => void, onBlur: () => void): void => {
  const handleFocusIn = (e: FocusEvent) => {
    const {tagName} = e.target as HTMLElement;

    if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
      e.target?.addEventListener('blur', handleFocusOut);
      onFocus();
    }
  };

  const handleFocusOut = (e: Event) => {
    e.target?.removeEventListener('blur', handleFocusOut);
    onBlur();
  };

  return React.useEffect(() => {
    document.addEventListener('focusin', handleFocusIn);
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, []);
};

export default useActiveInput;
