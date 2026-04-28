/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';

export default function useLocalStorage(
  key: string,
): [value: string | null, setValue: (newValue: string | null) => void] {
  const [state, setState] = React.useState(window.localStorage.getItem(key));

  React.useEffect(() => {
    setState(window.localStorage.getItem(key));
  }, [key]);

  const setValue = React.useCallback(
    newValue => {
      if (newValue !== state) setState(newValue);
    },
    [key, state],
  );

  React.useEffect(() => {
    if (state) window.localStorage.setItem(key, state);
    else window.localStorage.removeItem(key);
  }, [state]);

  return React.useMemo(() => [state, setValue], [state, setValue]);
}
