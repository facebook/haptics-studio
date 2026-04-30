/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {useCallback, RefObject} from 'react';
import Constants, {
  ZoomGestureSlowdown,
  MouseWheelSlowdown,
} from '../globals/constants';
import {TimeLineState} from '../state/types';
import {useKeyboardEvent} from './useKeyboardEvent';

interface UseTimelineInteractionParams {
  /** Reference to the container element for position calculations */
  containerRef: RefObject<HTMLDivElement | undefined>;
  /** Current timeline state */
  timeline: TimeLineState | undefined;
  /** Current container width */
  containerWidth: number;
  /** Whether the platform is Windows (affects modifier key) */
  isOnWindows: boolean;
  /** Callback to scroll the timeline by a delta */
  scrollTimeline: (delta: number) => void;
  /** Callback to zoom the timeline */
  zoomTimeline: (delta: number, anchor: number | undefined) => void;
  /** Callback to play/stop audio */
  playStopAudio: (fromBeginning?: boolean) => void;
  /** Whether the project is open */
  isProjectOpen: boolean;
  /** Whether default controls are enabled */
  defaultControlsEnabled: boolean;
  /** Whether the clip has audio */
  hasAudio: boolean;
  /** Whether external audio flag is enabled */
  externalAudioEnabled: boolean;
}

interface UseTimelineInteractionReturn {
  /** Handler for wheel scroll events on the timeline */
  onTimelineScroll: (event: WheelEvent) => void;
  /** Handler for keyboard zoom events */
  onKeyboardZoom: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

/**
 * Custom hook that manages timeline interaction events for the Editor.
 *
 * This hook consolidates:
 * - Wheel scroll handling for panning and zooming
 * - Keyboard shortcuts for zoom (+/-)
 * - Spacebar playback trigger
 */
export function useTimelineInteraction({
  containerRef,
  timeline,
  containerWidth,
  isOnWindows,
  scrollTimeline,
  zoomTimeline,
  playStopAudio,
  isProjectOpen,
  defaultControlsEnabled,
  hasAudio,
  externalAudioEnabled,
}: UseTimelineInteractionParams): UseTimelineInteractionReturn {
  // Handle spacebar for audio playback
  const onKeyPress = useCallback(
    (e: KeyboardEvent) => {
      // If the External Audio flag is enabled, we don't want to play the audio from here
      if (externalAudioEnabled) return;

      if (
        e.key === ' ' &&
        isProjectOpen &&
        !defaultControlsEnabled &&
        hasAudio
      ) {
        e.preventDefault();
        e.stopPropagation();
        playStopAudio();
      }
    },
    [
      defaultControlsEnabled,
      hasAudio,
      isProjectOpen,
      externalAudioEnabled,
      playStopAudio,
    ],
  );
  useKeyboardEvent('keyup', onKeyPress);

  // Handle wheel scroll for panning and zooming
  const onTimelineScroll = useCallback(
    (event: WheelEvent) => {
      if (!timeline) return;

      // Keep the scroll speed the same at different zoom levels
      const timelineWindowSize = timeline.endTime - timeline.startTime;

      // Touchpad panning left and right
      if (event.deltaX !== 0) {
        scrollTimeline(
          (-event.deltaX / MouseWheelSlowdown) * timelineWindowSize,
        );
      } else if (event.metaKey || event.ctrlKey) {
        // Zoom event
        const x =
          event.clientX -
          (containerRef.current?.getBoundingClientRect().x || 0) -
          Constants.plot.margin.left;
        zoomTimeline(
          event.deltaY / ZoomGestureSlowdown,
          x /
            (containerWidth -
              Constants.plot.margin.left -
              Constants.plot.margin.right),
        );
      } else {
        // Regular mouse scroll
        scrollTimeline(
          (event.deltaY / MouseWheelSlowdown) * timelineWindowSize,
        );
      }
    },
    [
      timeline?.startTime,
      timeline?.endTime,
      containerWidth,
      containerRef,
      scrollTimeline,
      zoomTimeline,
    ],
  );

  // Handle keyboard zoom shortcuts (+/-)
  const onKeyboardZoom = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const modifierKey = isOnWindows ? e.ctrlKey : e.metaKey;
      if (e.key === '-' && modifierKey) {
        zoomTimeline(0.1, undefined);
      }
      // Note: the keyboard layout English international has the + key above the =
      if ((e.key === '+' || e.key === '=') && modifierKey) {
        zoomTimeline(-0.1, undefined);
      }
    },
    [isOnWindows, zoomTimeline],
  );

  return {
    onTimelineScroll,
    onKeyboardZoom,
  };
}
