/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {useEffect, useState, useMemo} from 'react';
import {useDispatch} from 'react-redux';

import appSlice from '../state/app/slice';
import Constants from '../globals/constants';
import {
  douglasPeucker,
  editorDataFromHaptic,
  filteredDataFromBrush,
} from '../globals/utils';
import {
  AudioEnvelope,
  ClipboardContent,
  EditorPointData,
  EnvelopeType,
  TimeLineState,
} from '../state/types';
import {HapticData} from '../../../main/src/hapticsSdk';

interface UseEnvelopeDataParams {
  /** The haptic data from the current clip */
  haptic: HapticData | undefined;
  /** The SVG audio envelope data */
  svg: AudioEnvelope | undefined;
  /** The current timeline state */
  timeline: TimeLineState | undefined;
  /** The clipboard content for paste operations */
  clipboard: ClipboardContent;
  /** Currently selected points */
  selectedPoints: number[];
  /** Current clip ID */
  currentClipId: string | undefined;
  /** Current envelope visibility */
  visibleEnvelope: EnvelopeType;
  /** Redux action to set frame data */
  setFrameAction: (
    amplitude: EditorPointData[],
    frequency: EditorPointData[],
    timeline: TimeLineState,
    selectedPoints: number[],
  ) => void;
}

interface EnvelopeData {
  amplitude: EditorPointData[];
  frequency: EditorPointData[];
  decimatedAmplitude: EditorPointData[] | undefined;
  decimatedFrequency: EditorPointData[] | undefined;
}

interface UseEnvelopeDataReturn {
  /** Processed envelope data with decimation */
  envelopes: EnvelopeData;
  /** Audio envelope from SVG */
  audioEnvelope: EditorPointData[];
  /** Filtered audio envelope within the timeline window */
  filteredEnvelope: EditorPointData[];
  /** Clipboard data converted to editor point format */
  envelopeClipboard: {
    amplitude: EditorPointData[];
    frequency: EditorPointData[];
  };
}

/**
 * Custom hook that manages envelope data processing for the Editor.
 *
 * This hook consolidates:
 * - Haptic data to editor point conversion with decimation
 * - Audio envelope state management
 * - Filtered envelope calculation based on timeline
 * - Clipboard data transformation
 * - IPC menu state updates for emphasis/copy
 */
export function useEnvelopeData({
  haptic,
  svg,
  timeline,
  clipboard,
  selectedPoints,
  currentClipId,
  visibleEnvelope,
  setFrameAction,
}: UseEnvelopeDataParams): UseEnvelopeDataReturn {
  const dispatch = useDispatch();

  // Audio envelope from SVG
  const [audioEnvelope, setAudioEnvelope] = useState<EditorPointData[]>([]);

  // Filtered audio envelope within the timeline window
  const [filteredEnvelope, setFilteredEnvelope] = useState<EditorPointData[]>(
    [],
  );

  // Clipboard data converted to editor format
  const [envelopeClipboard, setEnvelopeClipboard] = useState<{
    amplitude: EditorPointData[];
    frequency: EditorPointData[];
  }>({amplitude: [], frequency: []});

  // Process haptic data into envelope data with decimation
  const envelopes = useMemo(() => {
    const {amplitude, frequency} = editorDataFromHaptic(haptic);
    let decimatedAmplitude: EditorPointData[] | undefined = [];
    let decimatedFrequency: EditorPointData[] | undefined = [];

    if (haptic) {
      const shouldDecimate =
        amplitude.length > Constants.plot.decimation.threshold;
      decimatedAmplitude = shouldDecimate
        ? douglasPeucker(amplitude, Constants.plot.decimation.epsilon)
        : undefined;
      decimatedFrequency = shouldDecimate
        ? douglasPeucker(frequency, Constants.plot.decimation.epsilon)
        : undefined;
    }

    return {amplitude, decimatedAmplitude, frequency, decimatedFrequency};
  }, [
    haptic?.signals.continuous.envelopes.amplitude,
    haptic?.signals.continuous.envelopes.frequency,
  ]);

  // Update frame state when envelopes or timeline changes
  useEffect(() => {
    if (timeline) {
      dispatch(
        setFrameAction(
          envelopes.amplitude,
          envelopes.frequency,
          timeline,
          selectedPoints,
        ) as any,
      );
    }
  }, [
    dispatch,
    setFrameAction,
    envelopes.amplitude,
    envelopes.frequency,
    timeline?.startTime,
    timeline?.endTime,
    selectedPoints,
  ]);

  // Update IPC menu state for emphasis and copy operations
  useEffect(() => {
    if (visibleEnvelope === EnvelopeType.Amplitude) {
      const hasEmphasisPointsSelected = selectedPoints
        .map(
          s =>
            envelopes.amplitude[s] &&
            envelopes.amplitude[s].emphasis !== undefined,
        )
        .reduce((a, b) => a || b, false);
      dispatch(
        appSlice.actions.toggleEmphasisMenu({
          checked: hasEmphasisPointsSelected,
          enabled: selectedPoints.length > 0,
        }),
      );
    }
    dispatch(
      appSlice.actions.toggleCopyMenu({
        enabled: selectedPoints.length > 0,
      }),
    );
  }, [selectedPoints, envelopes.amplitude, visibleEnvelope]);

  // Transform clipboard content to editor point format
  useEffect(() => {
    setEnvelopeClipboard({
      amplitude: clipboard.amplitude.map((p, idx) => ({
        x: p.time,
        y: p.amplitude,
        index: idx,
        emphasis: p.emphasis
          ? {y: p.emphasis.amplitude, frequency: p.emphasis.frequency}
          : undefined,
      })),
      frequency: clipboard.frequency.map((p, idx) => ({
        x: p.time,
        y: p.frequency,
        index: idx,
      })),
    });
  }, [clipboard]);

  // Initialize audio envelope from SVG data
  useEffect(() => {
    if (svg && svg.envelope) {
      setAudioEnvelope(
        svg.envelope.map((i, idx) => ({
          x: i.time,
          y: i.amplitude,
          index: idx,
        })),
      );
    } else {
      setAudioEnvelope([]);
      setFilteredEnvelope([]);
    }
  }, [svg]);

  // Filter audio envelope based on current timeline window
  useEffect(() => {
    if (!timeline) return;

    setFilteredEnvelope(filteredDataFromBrush(audioEnvelope, timeline));
  }, [timeline?.startTime, timeline?.endTime, audioEnvelope, currentClipId]);

  return {
    envelopes,
    audioEnvelope,
    filteredEnvelope,
    envelopeClipboard,
  };
}
