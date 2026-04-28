/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useContext} from 'react';
import path from 'path';
import {useDispatch} from 'react-redux';

import {AppContext} from '../../../containers/App';
import {useStyles} from './RightPanelTools.styles';
import Tooltip from '../../common/Tooltip';

import RelocateIcon from '../../../images/icon-paperclip.svg';
import PlayIcon from '../../../images/icon-play.svg';
import StopIcon from '../../../images/icon-stop.svg';
import AudioFileIcon from '../../../images/audio-file.svg';
import NoAudioFileIcon from '../../../images/no-audio-file.svg';
import AudioFileMissingIcon from '../../../images/audio-file-missing.svg';

type AudioFileState = 'default' | 'noFile' | 'missingFile';
const AudioFileIconMap: Record<AudioFileState, string> = {
  default: AudioFileIcon,
  noFile: NoAudioFileIcon,
  missingFile: AudioFileMissingIcon,
};

/**
 * Info about the audio file associated to the clip
 */
function AudioFile(props: {hideActionButton?: boolean}) {
  const classes = useStyles();
  const dispatch = useDispatch();
  const {selectors, actions, lang} = useContext(AppContext);
  const audio = selectors.project.getCurrentClipAudio();
  const currentClipId = selectors.project.getCurrentClipId();
  const isAudioPlaying = selectors.app.isAudioPlaying();
  const [hoveredButton, setHoveredButton] = React.useState<
    'action' | 'play' | undefined
  >(undefined);
  const buttonContainerRef = React.useRef<HTMLDivElement>(null);

  const playbackSupported = React.useMemo(
    () =>
      audio?.path &&
      !audio?.path.endsWith('.aiff') &&
      !audio?.path.endsWith('.aif'),
    [audio],
  );

  const audioFileState: AudioFileState = React.useMemo(() => {
    if (audio && audio.exists) {
      return 'default';
    } else if (audio?.path) {
      return 'missingFile';
    }
    return 'noFile';
  }, [audio]);

  const onButtonClick = () => {
    switch (audioFileState) {
      case 'default':
        if (audio?.path) {
          dispatch(actions.project.openSystemFolder({path: audio.path}));
        }
        break;
      case 'missingFile':
        if (currentClipId) {
          dispatch(
            actions.project.requestRelocateAsset({clipId: currentClipId}),
          );
        }
        break;
      case 'noFile':
        if (currentClipId) {
          dispatch(
            actions.project.requestAddAudioToClip({clipId: currentClipId}),
          );
        }
        break;
      default:
        break;
    }
  };

  const title = () => {
    if (audio && audio.path) {
      return path.basename(audio.path);
    } else {
      return lang('editor.no-audio-file');
    }
  };

  const buttonTitle = () => {
    switch (audioFileState) {
      case 'default':
      case 'missingFile':
        return lang('editor.locate-file');
      case 'noFile':
        return lang('editor.add-audio');
      default:
        return '';
    }
  };

  const onPlayAudio = () => {
    if (isAudioPlaying) {
      // Stop audio using custom event
      window.dispatchEvent(new CustomEvent('stop_audio'));
    } else {
      // Play audio from beginning using custom event
      window.dispatchEvent(new CustomEvent('play_audio'));
    }
  };

  let tooltipPosition = 0;
  if (buttonContainerRef.current) {
    const rect = buttonContainerRef.current.getBoundingClientRect();
    tooltipPosition = rect.top + rect.height;
  }

  return (
    <div className={classes.container} data-testid="audio-file-widget">
      <div className={classes.block}>
        <span className={classes.title}>{lang('editor.audio-file')}</span>
        <div className={classes.sectionContainer}>
          <div
            className={classes.audio}
            style={{
              display: 'flex',
              padding: '2px 0 2px 0',
              width: '100%',
              minWidth: 0,
            }}>
            <div
              style={{
                display: 'flex',
                flex: 1,
                alignItems: 'center',
                gap: 4,
                minWidth: 0,
              }}>
              <img
                src={AudioFileIconMap[audioFileState]}
                alt="audio-file"
                style={{flexShrink: 0}}
              />
              <section
                style={{
                  flex: 1,
                  display: 'block',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                }}>
                {title()}
              </section>
            </div>
            <aside style={{display: 'flex', gap: 4}} ref={buttonContainerRef}>
              {!props.hideActionButton ? (
                <button
                  type="button"
                  style={{alignSelf: 'flex-end', position: 'relative'}}
                  data-testid="audio-button"
                  className="hsbutton icon secondary"
                  onClick={onButtonClick}
                  onMouseEnter={() => setHoveredButton('action')}
                  onMouseLeave={() => setHoveredButton(undefined)}>
                  <img src={RelocateIcon} alt={buttonTitle()} />
                  {hoveredButton === 'action' ? (
                    <Tooltip text={buttonTitle()} top={tooltipPosition} />
                  ) : null}
                </button>
              ) : null}
              {audioFileState === 'default' ? (
                <button
                  type="button"
                  style={{
                    alignSelf: 'flex-end',
                    position: 'relative',
                    opacity: playbackSupported ? 1 : 0.5,
                  }}
                  data-testid="play-button"
                  className="hsbutton icon secondary"
                  onClick={playbackSupported ? onPlayAudio : undefined}
                  onMouseEnter={() => setHoveredButton('play')}
                  onMouseLeave={() => setHoveredButton(undefined)}>
                  {isAudioPlaying ? (
                    <img src={StopIcon} alt={lang('editor.stop-audio')} />
                  ) : (
                    <img src={PlayIcon} alt={lang('editor.play-audio')} />
                  )}
                  {hoveredButton === 'play' ? (
                    <Tooltip
                      text={
                        !playbackSupported
                          ? lang('editor.play-audio-aiff')
                          : isAudioPlaying
                            ? lang('editor.stop-audio')
                            : lang('editor.play-audio')
                      }
                      shortcut={
                        playbackSupported
                          ? lang('editor.play-audio-shortcut')
                          : undefined
                      }
                      top={tooltipPosition}
                      style={{transform: 'translateX(calc(-50% + 20px))'}}
                    />
                  ) : null}
                </button>
              ) : null}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

AudioFile.defaultProps = {
  hideActionButton: false,
};

export default React.memo(AudioFile);
