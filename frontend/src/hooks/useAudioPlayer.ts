/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {useEffect, useRef, useState, useCallback, SyntheticEvent} from 'react';
import {useDispatch} from 'react-redux';

import {mediaPath} from '../globals/utils';

interface UseAudioPlayerParams {
  /** Current clip ID - used to reset playhead when clip changes */
  currentClipId: string | undefined;
  /** Ref to the audio element - managed by the parent component */
  audioPlayerRef: React.RefObject<HTMLAudioElement | null>;
  /** Path to the audio file */
  audioPath: string | undefined;
  /** Whether the app is running on Windows */
  isOnWindows: boolean;
  /** Redux action to set audio playing state */
  setAudioPlayingAction: (payload: {isPlaying: boolean}) => {
    type: string;
    payload: {isPlaying: boolean};
  };
}

interface UseAudioPlayerReturn {
  /** Current playhead position in seconds, undefined when not playing */
  playhead: number | undefined;
  /** Handler for audio play/pause events */
  onPlayerTimeUpdate: (e: SyntheticEvent<HTMLElement>) => void;
  /** Handler for audio ended event */
  onPlayerEnded: () => void;
  /** Blob URL for the audio file, or undefined if not loaded */
  audioBlobUrl: string | undefined;
  /** Whether the audio is currently loading */
  isAudioLoading: boolean;
  /** Play/stop audio - toggles play/stop. If fromBeginning is true, resets to start first */
  playStopAudio: (fromBeginning?: boolean) => void;
  /** Stop audio - pauses and resets to beginning */
  stopAudio: () => void;
}

/**
 * Custom hook that manages audio playback state for the Editor.
 *
 * This hook handles:
 * - Pre-loading audio files as blob URLs for reliable playback
 * - Playhead position tracking with interval updates
 * - IPC event handling for play_audio commands
 * - Cleanup when clip changes
 *
 * Note: The audio element ref is passed in from the parent component
 * to avoid TypeScript ref typing issues with JSX elements.
 */
export function useAudioPlayer({
  currentClipId,
  audioPlayerRef,
  audioPath,
  isOnWindows,
  setAudioPlayingAction,
}: UseAudioPlayerParams): UseAudioPlayerReturn {
  const dispatch = useDispatch();
  const audioPlayerInterval = useRef<NodeJS.Timeout | null>(null);
  const [playhead, setPlayhead] = useState<number | undefined>(undefined);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | undefined>(
    undefined,
  );
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const previousBlobUrlRef = useRef<string | undefined>(undefined);

  // Pre-load audio file as blob URL when clip changes
  useEffect(() => {
    // Clean up previous blob URL
    if (previousBlobUrlRef.current) {
      URL.revokeObjectURL(previousBlobUrlRef.current);
      previousBlobUrlRef.current = undefined;
    }

    // Reset state
    setAudioBlobUrl(undefined);

    if (!audioPath || !currentClipId) {
      setIsAudioLoading(false);
      return;
    }

    setIsAudioLoading(true);

    // Use AbortController to cancel stale fetch operations
    const abortController = new AbortController();

    const loadAudio = async () => {
      try {
        const url = mediaPath(audioPath, isOnWindows);
        const response = await fetch(url, {signal: abortController.signal});

        if (!response.ok) {
          throw new Error(`Failed to fetch audio: ${response.status}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        previousBlobUrlRef.current = blobUrl;
        setAudioBlobUrl(blobUrl);
      } catch (error) {
        // Ignore abort errors - these are expected when dependencies change
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        // eslint-disable-next-line no-console
        console.error('[Audio] Failed to pre-load audio:', error);
      } finally {
        // Only update loading state if not aborted
        if (!abortController.signal.aborted) {
          setIsAudioLoading(false);
        }
      }
    };

    loadAudio();

    // Cleanup: abort any in-flight fetch and revoke blob URL
    return () => {
      abortController.abort();
      if (previousBlobUrlRef.current) {
        URL.revokeObjectURL(previousBlobUrlRef.current);
        previousBlobUrlRef.current = undefined;
      }
    };
  }, [currentClipId, audioPath, isOnWindows]);

  const playStopAudio = useCallback(
    (fromBeginning = false) => {
      const audio = audioPlayerRef.current;
      if (!audio) return;

      if (audio.paused) {
        if (fromBeginning) {
          audio.currentTime = 0;
        }
        audio.play();
      } else {
        // Stop instead of pause - reset to beginning
        audio.pause();
        audio.currentTime = 0;
        dispatch(setAudioPlayingAction({isPlaying: false}));
      }
    },
    [audioPlayerRef, dispatch, setAudioPlayingAction],
  );

  const stopAudio = useCallback(() => {
    const audio = audioPlayerRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      dispatch(setAudioPlayingAction({isPlaying: false}));
    }
  }, [audioPlayerRef, dispatch, setAudioPlayingAction]);

  // Set up the event listener for play_audio command from menu, and custom event for stop_audio
  useEffect(() => {
    // Listen for custom stop_audio event from other components
    const handleStopAudio = () => {
      stopAudio();
    };
    window.addEventListener('stop_audio', handleStopAudio);

    // Listen for custom toggle_audio event from other components
    const handleToggleAudio = () => {
      playStopAudio(true);
    };
    window.addEventListener('play_audio', handleToggleAudio);

    return () => {
      window.removeEventListener('stop_audio', handleStopAudio);
      window.removeEventListener('play_audio', handleToggleAudio);
    };
  }, [playStopAudio, stopAudio]);

  // Reset playhead, stop audio, and clear interval when clip changes
  useEffect(() => {
    // Stop any playing audio when switching clips
    const audio = audioPlayerRef.current;
    if (audio && !audio.paused) {
      audio.pause();
      audio.currentTime = 0;
    }
    // Reset Redux state
    dispatch(setAudioPlayingAction({isPlaying: false}));
    // Clear interval
    if (audioPlayerInterval.current) {
      clearInterval(audioPlayerInterval.current);
      audioPlayerInterval.current = null;
    }
    setPlayhead(undefined);
  }, [currentClipId, audioPlayerRef, dispatch, setAudioPlayingAction]);

  // Handler for audio play/pause events - manages playhead interval and Redux state
  const onPlayerTimeUpdate = useCallback(
    (e: SyntheticEvent<HTMLElement>) => {
      const audio = e.currentTarget as HTMLAudioElement;

      if (!audio.paused) {
        dispatch(setAudioPlayingAction({isPlaying: true}));
        if (!audioPlayerInterval.current) {
          audioPlayerInterval.current = setInterval(() => {
            setPlayhead(audio.currentTime);
          }, 16);
        }
      } else {
        dispatch(setAudioPlayingAction({isPlaying: false}));
        setPlayhead(undefined);
        if (audioPlayerInterval.current) {
          clearInterval(audioPlayerInterval.current);
          audioPlayerInterval.current = null;
        }
      }
    },
    [dispatch, setAudioPlayingAction],
  );

  // Handler for audio ended event - clears playhead and updates Redux state
  const onPlayerEnded = useCallback(() => {
    dispatch(setAudioPlayingAction({isPlaying: false}));
    setPlayhead(undefined);
    if (audioPlayerInterval.current) {
      clearInterval(audioPlayerInterval.current);
      audioPlayerInterval.current = null;
    }
  }, [dispatch, setAudioPlayingAction]);

  return {
    playhead,
    onPlayerTimeUpdate,
    onPlayerEnded,
    audioBlobUrl,
    isAudioLoading,
    playStopAudio,
    stopAudio,
  };
}
