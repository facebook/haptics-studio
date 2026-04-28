/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {DateTime} from 'luxon';
import {TutorialProgressKey} from '../globals/constants';

const useTutorialStorage = (
  id: string,
  disabled?: boolean,
): {
  isClipCompleted: (clipId: string) => boolean;
  setClipComplete: (clipId: string) => void;
  getCompletedClipsCount: () => number;
  clearTutorialHistory: () => void;
} => {
  const key = `${TutorialProgressKey}-${id}`;
  const [cache, setCache] = React.useState(DateTime.now().toMillis());
  const progress = React.useMemo(() => {
    if (disabled) return {};
    try {
      const saved = window.localStorage.getItem(key);
      if (!saved) return {};
      return JSON.parse(saved) as Record<string, boolean>;
    } catch {
      return {};
    }
  }, [key, cache, disabled]);

  const isClipCompleted = React.useCallback(
    (clipId: string) => {
      if (disabled) return false;

      return clipId in progress ? progress[clipId] : false;
    },
    [progress, disabled],
  );

  const setClipComplete = React.useCallback(
    (clipId: string) => {
      if (disabled) return;

      const update = {...progress, [clipId]: true};
      window.localStorage.setItem(key, JSON.stringify(update));
      setCache(DateTime.now().toMillis());
    },
    [key, progress, disabled],
  );

  const getCompletedClipsCount = React.useCallback(() => {
    if (disabled) return 0;
    return Object.keys(progress).filter(clipId => progress[clipId]).length;
  }, [key, progress, disabled]);

  const clearTutorialHistory = React.useCallback(() => {
    window.localStorage.removeItem(key);
    setCache(DateTime.now().toMillis());
  }, [key]);

  return {
    isClipCompleted,
    setClipComplete,
    getCompletedClipsCount,
    clearTutorialHistory,
  };
};

export default useTutorialStorage;
