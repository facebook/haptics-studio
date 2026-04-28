/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useContext, useEffect} from 'react';
import {useDispatch} from 'react-redux';

import {AppContext} from '../../../containers/App';
import {useStyles} from './RightPanelTools.styles';
import {timeFormat, timeFromString} from '../../../globals/utils';
import {TrimTimeEditingStep} from '../../../globals/constants';
import {useKeyboardEvent} from '../../../hooks/useKeyboardEvent';

import RevertIcon from '../../../images/revert-icon.svg';

/**
 * Tools for drawing envlopes
 */
function TrimTool() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const {selectors, actions, lang} = useContext(AppContext);
  const duration = selectors.project.getCurrentClipOriginalDuration();
  const currentClipId = selectors.project.getCurrentClipId();
  const isTrimming = selectors.editingTools.isTrimmingEnabled();
  const trimTime = selectors.editingTools.getTrimTime();
  const [timeString, setTimeString] = React.useState<string>(
    timeFormat(duration),
  );

  useEffect(() => {
    if (trimTime !== undefined) {
      setTimeString(timeFormat(trimTime));
    } else {
      setTimeString(timeFormat(duration));
    }
  }, [trimTime, isTrimming, duration]);

  const onButtonClick = () => {
    if (isTrimming) {
      dispatch(actions.editingTools.commitTrim({time: trimTime}));
    } else {
      dispatch(actions.editingTools.revertTrim());
    }
  };

  const onTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value.replace(/[^0-9.]/g, '');
    setTimeString(value);
  };

  const onStep = (direction: 'up' | 'down') => {
    const delta =
      direction === 'up' ? TrimTimeEditingStep : -TrimTimeEditingStep;

    let time = timeFromString(timeString) + delta;
    time = Math.max(0.1, Math.min(time, duration));

    if (currentClipId && time !== undefined) {
      dispatch(actions.editingTools.setTrimTime({time}));
    }
  };

  const onUpdateTrim = (commit: boolean) => {
    let time = parseFloat(timeString);
    time = Math.max(0.1, Math.min(time, duration));
    if (time) {
      setTimeString(timeFormat(time));
      dispatch(actions.editingTools.setTrimTime({time}));
      if (commit) {
        dispatch(actions.editingTools.commitTrim({time}));
      }
    }
  };

  const onNewTrimClick = () => {
    dispatch(actions.editingTools.enableTrim({duration, time: undefined}));
  };

  const onKeyboardPress = React.useCallback(
    (e: KeyboardEvent) => {
      if (!isTrimming) return;

      if (e.key === 'Enter') {
        onUpdateTrim(true);
      } else if (e.key === 'Escape') {
        dispatch(actions.editingTools.cancelTrim());
      } else if (e.key === 'ArrowUp') {
        onStep('up');
      } else if (e.key === 'ArrowDown') {
        onStep('down');
      }
    },
    [isTrimming, timeString, currentClipId, trimTime],
  );
  useKeyboardEvent('keydown', onKeyboardPress);

  const onFocus = (e: React.FocusEvent<HTMLInputElement, Element>) => {
    e.target.select();
    dispatch(actions.editingTools.enableTrim({duration, time: trimTime}));
  };

  return (
    <div className={classes.container} data-testid="clip-trim-widget">
      <div className={classes.block}>
        <span
          className={`${classes.title} ${trimTime === undefined ? 'centered' : ''}`}>
          {lang('editor.clip-duration')}
          <aside>{timeFormat(duration, true)}</aside>
        </span>
        {trimTime !== undefined ? (
          <>
            <span style={{fontSize: '12px'}}>
              {lang('editor.new-duration')}
            </span>
            <div className={classes.sectionContainer}>
              <div className={classes.inputContainer} style={{flex: '1'}}>
                <input
                  type="text"
                  style={{width: '100%'}}
                  readOnly={!isTrimming}
                  value={timeString}
                  onChange={onTextChange}
                  onFocus={onFocus}
                  onBlur={() => onUpdateTrim(false)}
                />
                {isTrimming ? (
                  <aside className={classes.stepper}>
                    <img
                      data-testid="step-time-up"
                      src={require('../../../images/chevron-up.svg')}
                      role="button"
                      aria-label="step up"
                      onClick={onStep.bind(null, 'up')}
                    />
                    <img
                      data-testid="step-time-down"
                      src={require('../../../images/chevron-down.svg')}
                      role="button"
                      aria-label="step down"
                      onClick={onStep.bind(null, 'down')}
                    />
                  </aside>
                ) : null}
              </div>
              <button
                type="button"
                style={{flex: '1', padding: 0}}
                data-testid="trim-button"
                className={`hsbutton ${classes.trimButton} icon ${isTrimming ? 'primary' : 'secondary'}`}
                onClick={onButtonClick}>
                {isTrimming ? (
                  lang('global.confirm')
                ) : (
                  <>
                    <img src={RevertIcon} />
                    {lang('editor.revert')}
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            data-testid="new-trim-button"
            className={`hsbutton ${classes.trimButton} icon secondary`}
            onClick={onNewTrimClick}
            style={{width: '50%'}}>
            {lang('editor.new-trim')}
          </button>
        )}
      </div>
    </div>
  );
}

export default React.memo(TrimTool);
