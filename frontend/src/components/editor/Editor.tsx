/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {
  useEffect,
  useState,
  useRef,
  useContext,
  useCallback,
} from 'react';
import {useDispatch} from 'react-redux';

import {createAppStyle} from '../../styles/theme.style';
import Constants from '../../globals/constants';
import {AppContext} from '../../containers/App';
import AudioEnvelope from './envelope/AudioEnvelope';
import HapticEnvelope from './envelope/HapticEnvelope';
import useBrushState from '../../hooks/useBrushState';
import Timeline from './timeline/Timeline';
import Spinner from '../common/Spinner';
import EditorToolbar from './EditorToolbar';
import TrimOverlay from './envelope/TrimOverlay';
import {EnvelopeType, FocusArea} from '../../state/types';
import {getEmptyClip} from '../../state/project/selectors';
import GuidanceOverlay from './GuidanceOverlay';
import PlotArea from './envelope/PlotArea';
import {Tool} from '../../state/editingTools/types';
import {useFocusArea} from '../../hooks/useFocusArea';
import {useEditorLayout} from '../../hooks/useEditorLayout';
import {useEnvelopeData} from '../../hooks/useEnvelopeData';
import {useTimelineInteraction} from '../../hooks/useTimelineInteraction';
import {useAudioPlayer} from '../../hooks/useAudioPlayer';

/** Default timeline state used when no clip timeline is available */
const DEFAULT_TIMELINE = {startTime: 0, endTime: 0, duration: 0, samples: 1};

const plotAreaProps = {
  position: 'absolute',
  top: 0,
  left: 0,
};

const useStyles = createAppStyle(theme => ({
  container: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    margin: '0px 0px 8px',
    backgroundColor: theme.colors.background.dark,
    '&.disabled': {
      pointerEvents: 'none',
    },
  },
  plotContainer: {
    userSelect: 'none',
    position: 'relative',
    marginLeft: 0,
    '&.disabled': {
      opacity: 0.3,
    },
  },
  grid: {
    ...plotAreaProps,
    zIndex: 2,
  },
  plot: {
    ...plotAreaProps,
    zIndex: 1,
  },
  loading: {
    zIndex: 10,
    position: 'absolute',
    top: `${Constants.plot.margin.top}px`,
    left: `${Constants.plot.margin.left}px`,
    bottom: `${Constants.plot.margin.bottom}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  front: {
    zIndex: 2,
  },
  back: {
    opacity: 0.3,
  },
}));

/**
 * This component is the full plot editor, it composes the Timeline, PlotArea and HapticEnvelope components over a single view.
 */
function Editor(props: {className: string}) {
  const classes = useStyles();
  const dispatch = useDispatch();
  const {selectors, actions} = useContext(AppContext);
  const visibility = selectors.app.getVisibility();
  const {setFocus: setPlotFocus} = useFocusArea(FocusArea.Plot);
  const clipboard = selectors.app.getClipboard();
  const project = selectors.project.getProjectInfo();
  const rightPanelWidth = selectors.app.getSidePanelWidth('right');
  const leftPanelWidth = selectors.app.getSidePanelWidth(
    project.isTutorial ? 'tutorial' : 'left',
  );
  const emptyClip = getEmptyClip();
  const clip = selectors.project.getCurrentClip() ?? emptyClip;
  const clipsCount = selectors.project.getClipsCount();
  const hasUndoHistory = selectors.project.hasCurrentClipUndos();
  const hasRedoList = selectors.project.hasCurrentClipRedos();
  const loading = selectors.project.getCurrentClipLoading();
  const currentClipId = selectors.project.getCurrentClipId();
  const trimTime = selectors.editingTools.getTrimTime();
  const isTrimmingClip = selectors.editingTools.getActiveTool() === Tool.Trim;
  const defaultControlsEnabled = selectors.app.getDefaultControlStatus();
  const isOnWindows = selectors.app.isOnWindows();

  const externalAudioFlagEnabled =
    localStorage.getItem('flags:externalAudio') === 'true';

  const {svg} = clip;
  const {selectedPoints, selectedEmphasis, haptic} = clip.state.present;

  const container = useRef<HTMLDivElement>();
  const [size, setSize] = useState({w: 0, h: 0});

  // Create audio player ref locally and pass to hook
  const audioPlayerRef = useRef<HTMLAudioElement>(null);

  const {
    playhead: audioPlayhead,
    onPlayerTimeUpdate,
    onPlayerEnded,
    audioBlobUrl,
    playStopAudio,
  } = useAudioPlayer({
    currentClipId,
    audioPlayerRef,
    audioPath: clip.audio?.path,
    isOnWindows,
    setAudioPlayingAction: actions.app.setAudioPlaying,
  });

  // The start and end window of the brush
  const {
    brushCursorType,
    setEditorWidth,
    setCursorSelection,
    scrollTimeline,
    zoomTimeline,
  } = useBrushState({
    timelineState: clip.timeline ?? DEFAULT_TIMELINE,
    onTimelineChange: (timelineState, cursor) => {
      dispatch(
        actions.project.setTimelineState({state: timelineState, cursor}),
      );
    },
  });

  const EditorHeight =
    size.h - Constants.toolbar.height - Constants.timeline.height;

  // Use custom hook for layout management
  useEditorLayout({
    containerRef: container,
    rightPanelWidth,
    leftPanelWidth,
    onSizeChange: setSize,
    setEditorWidth,
  });

  // Use custom hook for envelope data processing
  const {envelopes, audioEnvelope, filteredEnvelope, envelopeClipboard} =
    useEnvelopeData({
      haptic,
      svg,
      timeline: clip.timeline,
      clipboard,
      selectedPoints,
      currentClipId,
      visibleEnvelope: visibility.envelope,
      setFrameAction: actions.frame.set,
    });

  // Use custom hook for timeline interaction (scroll, zoom, keyboard)
  const {onTimelineScroll, onKeyboardZoom} = useTimelineInteraction({
    containerRef: container,
    timeline: clip.timeline,
    containerWidth: size.w,
    isOnWindows,
    scrollTimeline,
    zoomTimeline,
    playStopAudio,
    isProjectOpen: project.isOpen,
    defaultControlsEnabled,
    hasAudio: Boolean(clip.audio?.path && clip.audio?.exists),
    externalAudioEnabled: externalAudioFlagEnabled,
  });

  useEffect(() => {
    // Update the Haptic on the file system and remotely. Do so only if we have no past or future actions. This prevents an unwanted update call when opening the file for the first time.
    if (currentClipId && haptic && (hasUndoHistory || hasRedoList)) {
      dispatch(actions.project.updateHaptic({clipId: currentClipId, haptic}));
    }
  }, [clip.state.present.revision]);

  const onTrimConfirm = () => {
    if (currentClipId) {
      dispatch(actions.editingTools.commitTrim({time: trimTime}));
    }
  };

  const onTrimMove = (time: number | undefined) => {
    if (currentClipId) {
      if (time === undefined) {
        dispatch(actions.editingTools.revertTrim());
      } else {
        const newTime = Math.max(
          0,
          Math.min(time, clip.timeline?.duration || 0),
        );
        dispatch(actions.editingTools.setTrimTime({time: newTime}));
      }
    }
  };

  const onPlotFocus = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      setPlotFocus();
    },
    [setPlotFocus],
  );

  const envelopeFor = (type: EnvelopeType) => {
    if (!currentClipId) return null;

    return (
      <HapticEnvelope
        type={type}
        className={`${classes.plot} ${visibility.envelope === type ? classes.front : classes.back}`}
        width={size.w}
        height={EditorHeight}
        clipboard={envelopeClipboard}
        timeline={clip.timeline ?? DEFAULT_TIMELINE}
        isSelected={visibility.envelope === type}
        selectedPoints={selectedPoints}
        selectedEmphasis={selectedEmphasis}
        clipId={currentClipId}
      />
    );
  };

  return (
    <div
      ref={container as any}
      className={`${props.className} ${classes.container} ${!currentClipId ? 'disabled' : ''}`}
      style={{
        marginLeft: `${leftPanelWidth}px`,
        marginRight: `${rightPanelWidth}px`,
      }}
      onKeyDown={onKeyboardZoom}>
      {audioBlobUrl ? (
        <audio
          key={currentClipId}
          ref={audioPlayerRef}
          preload="auto"
          src={audioBlobUrl}
          onPause={onPlayerTimeUpdate}
          onPlay={onPlayerTimeUpdate}
          onEnded={onPlayerEnded}
          onError={e => {
            const audio = e.currentTarget;
            const error = audio.error;
            console.error('[Audio] Error event:', {
              code: error?.code,
              message: error?.message,
              networkState: audio.networkState,
              readyState: audio.readyState,
              src: audio.src,
            });
          }}
        />
      ) : null}

      {/* Editor area */}
      <div
        data-testid="editor"
        className={`${classes.plotContainer} ${!currentClipId ? 'disabled' : ''}`}
        style={{height: `${EditorHeight}px`, top: 0}}
        onWheel={onTimelineScroll as any}
        onClick={onPlotFocus}>
        <div className={classes.plot}>
          <AudioEnvelope
            width={size.w}
            height={EditorHeight}
            envelope={visibility.audio ? filteredEnvelope : []}
            timeline={
              clip.timeline ?? {...DEFAULT_TIMELINE, samples: 0, duration: 1}
            }
          />
        </div>

        <PlotArea
          className={classes.grid}
          width={size.w}
          height={EditorHeight}
          timeline={
            clip.timeline ?? {...DEFAULT_TIMELINE, samples: 0, duration: 1}
          }
          audioPlayhead={audioPlayhead}
          clipPlayhead={clip.playhead}
          clipId={currentClipId}
        />

        <>
          {envelopeFor(EnvelopeType.Amplitude)}
          {envelopeFor(EnvelopeType.Frequency)}
        </>

        {trimTime !== undefined || clip.trimAt !== undefined ? (
          <TrimOverlay
            clip={clip}
            width={size.w}
            height={EditorHeight}
            isTrimming={isTrimmingClip}
            trimTime={trimTime ?? clip.trimAt}
            onTrimMove={onTrimMove}
            onTrimConfirm={onTrimConfirm}
          />
        ) : null}

        {currentClipId && loading ? (
          <div
            className={classes.loading}
            style={{
              width: `${size.w - Constants.plot.margin.left - Constants.plot.margin.right}px`,
            }}>
            <Spinner />
          </div>
        ) : null}
      </div>

      <EditorToolbar />

      <Timeline
        data-testid="timeline"
        disabled={!currentClipId}
        width={size.w}
        envelope={audioEnvelope}
        amplitude={envelopes.decimatedAmplitude ?? envelopes.amplitude}
        frequency={envelopes.decimatedFrequency ?? envelopes.frequency}
        selected={visibility.envelope}
        timeline={clip.timeline ?? DEFAULT_TIMELINE}
        cursorType={brushCursorType}
        onSelection={setCursorSelection}
        audioPlayhead={audioPlayhead}
      />

      {clipsCount === 0 ? <GuidanceOverlay /> : null}
    </div>
  );
}

export default React.memo(Editor);
