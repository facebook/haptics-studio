/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable react/no-danger */
import {useDispatch} from 'react-redux';
import Slider from 'react-slider';
import React, {useContext, useState, useEffect, useMemo} from 'react';
import {AppContext} from '../../../containers/App';
import {theme} from '../../../styles/theme.style';
import {
  frequencyForSharpness,
  timeFormat,
  timeFromString,
} from '../../../globals/utils';
import {
  EditorEmphasisData,
  EmphasisType,
  EnvelopeType,
  FocusArea,
} from '../../../state/types';
import {getEmptyClip} from '../../../state/project/selectors';
import {useKeyboardEvent} from '../../../hooks/useKeyboardEvent';
import {DetailEditingStep} from '../../../globals/constants';
import {useStyles} from './RightPanelTools.styles';
import {Tool} from '../../../state/editingTools/types';

import FrequencyLowIcon from '../../../images/frequency-low.svg';
import FrequencyMediumIcon from '../../../images/frequency-medium.svg';
import FrequencyHighIcon from '../../../images/frequency-high.svg';
import { createRenderThumb, createRenderTrack } from '../../common/SliderRenderers';

/**
 * Detail editing for the selected points
 */
function DetailEditing() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const {selectors, actions, lang} = useContext(AppContext);
  const {envelope} = selectors.app.getVisibility();
  const emptyClip = getEmptyClip();
  const clip = selectors.project.getCurrentClip() ?? emptyClip;
  const clipId = selectors.project.getCurrentClipId();
  const {selectedPoints} = clip.state.present;
  const frame = selectors.frame.getCurrentFrame(envelope);
  const focus = selectors.app.getFocus();
  const pointDetail = selectors.app.getPointDetail();
  const activeTool = selectors.editingTools.getActiveTool();
  const [state, setState] = useState({
    time: '00:000',
    value: '0',
    emphasis: '0',
    emphasisFrequency: 0,
    hasEmphasis: false,
    multiple: false,
    multipleEmphasis: false,
  });
  const [editingField, setEditingField] = useState<
    'time' | 'value' | 'emphasis' | null
  >(null);

  const selection = frame.filter(p => selectedPoints.includes(p.index));

  const keydown = React.useCallback(
    (event: KeyboardEvent) => {
      if (focus !== FocusArea.RightPanel && focus !== FocusArea.Plot) return;

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          dispatch(actions.project.setSelectedPoints({clipId, points: []}));
          break;
        default:
          break;
      }
    },
    [focus],
  );
  useKeyboardEvent('keydown', keydown);

  const getCurrentValues = () => {
    // Prepare the local state witht he values from the store
    const values = selection.map(p => p.y);
    const value = Math.max(...values);
    const time = selection.length > 0 ? selection[0].x : 0;
    const emphasisArray = selection
      .map(p => p.emphasis)
      .filter(p => p !== undefined) as EditorEmphasisData[];
    const emphasisAmplitude =
      emphasisArray.length === 1
        ? emphasisArray[0].y
        : Math.max(...emphasisArray.map(e => e.y));
    const emphasisFrequency =
      emphasisArray.length === 1
        ? emphasisArray[0].frequency
        : Math.max(...emphasisArray.map(e => e.frequency));
    setState({
      time: timeFormat(time),
      value: value.toFixed(2),
      emphasis: emphasisAmplitude.toFixed(2),
      hasEmphasis: emphasisArray.length > 0,
      emphasisFrequency,
      multiple: selectedPoints.length > 1,
      multipleEmphasis: emphasisArray.length > 1,
    });
  };

  useEffect(() => {
    if (selectedPoints.length > 0 && editingField === null) {
      getCurrentValues();
    }
  }, [selectedPoints, frame, editingField]);

  const updateSelectionValue = (
    value: number,
    type: 'time' | 'value' | 'emphasis',
  ) => {
    switch (type) {
      case 'value':
        dispatch(actions.project.editSelectionValue({clipId, envelope, value}));
        break;
      case 'time':
        dispatch(
          actions.project.editSelectionTime({clipId, envelope, time: value}),
        );
        break;
      case 'emphasis':
        dispatch(
          actions.project.editSelectionEmphasisAmplitude({clipId, value}),
        );
        break;
      default:
        break;
    }
  };

  const onTextChange = (
    type: 'time' | 'value' | 'emphasis',
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.currentTarget.value.replace(/[^0-9.,]/g, '');

    switch (type) {
      case 'value':
        setState({...state, value});
        break;
      case 'time':
        setState({...state, time: value});
        break;
      case 'emphasis':
        setState({...state, emphasis: value});
        break;
      default:
        break;
    }

    // Apply changes as the user types
    if (type === 'time') {
      const val = timeFromString(value);
      if (val !== undefined) {
        updateSelectionValue(val, 'time');
      }
    } else {
      const val = parseFloat(value.replace(',', '.'));
      if (!isNaN(val)) {
        updateSelectionValue(val, type);
      }
    }
  };

  const onEditKeyDown = (
    type: 'time' | 'value' | 'emphasis',
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    switch (e.key) {
      case 'ArrowUp':
        onStep(type, 'up');
        break;
      case 'ArrowDown':
        onStep(type, 'down');
        break;
      case 'Enter':
        e.currentTarget.blur();
        break;
      default:
        break;
    }
  };

  const onEditFocus = (
    type: 'time' | 'value' | 'emphasis',
    e: React.FocusEvent<HTMLInputElement>,
  ) => {
    setEditingField(type);
    e.target.select();
  };

  const onEditBlur = () => {
    setEditingField(null);
  };

  const onStep = (
    type: 'time' | 'value' | 'emphasis',
    direction: 'up' | 'down',
  ) => {
    // Get the current value and add or subtract a 'step'
    // We use this instead of the default <input type='number' /> to show the step change in the plot, while the input editing commits only on Enter or on blur
    switch (type) {
      case 'value':
      case 'emphasis': {
        const delta =
          direction === 'up' ? DetailEditingStep : -DetailEditingStep;

        const current = parseFloat(state[type]);
        if (current !== undefined && !isNaN(current)) {
          updateSelectionValue(current + delta, type);
        }
        break;
      }
      case 'time': {
        const delta =
          direction === 'up' ? DetailEditingStep : -DetailEditingStep;

        const current = timeFromString(state.time);
        if (current !== undefined) {
          updateSelectionValue(current + delta, type);
        }
        break;
      }
      default:
        break;
    }
  };

  const onSliderChange = (value: number) => {
    // On slider change update only the local state
    setState({...state, emphasisFrequency: value});
  };

  const onSliderCommit = () => {
    // Commit the local state when the slider is done editing
    dispatch(
      actions.project.editSelectionEmphasisFrequency({
        clipId,
        value: state.emphasisFrequency,
      }),
    );
  };

  const onSliderButton = (value: number) => {
    dispatch(actions.project.editSelectionEmphasisFrequency({clipId, value}));
  };

  const onEmphasisDelete = () => {
    dispatch(actions.project.removeEmphasisFromSelectedPoints({}));
  };

  const emphasisColor = theme.colors.plot.emphasis;
  const renderTrack = useMemo(() => createRenderTrack(emphasisColor), [emphasisColor]);
  const renderThumb = useMemo(() => createRenderThumb(emphasisColor), [emphasisColor]);

  const stepperFor = (type: 'time' | 'value' | 'emphasis') => {
    return (
      <aside className={classes.stepper}>
        <img
          data-testid={`step-${type}-up`}
          src={require('../../../images/chevron-up.svg')}
          role="button"
          aria-label="step up"
          onClick={onStep.bind(null, type, 'up')}
        />
        <img
          data-testid={`step-${type}-down`}
          src={require('../../../images/chevron-down.svg')}
          role="button"
          aria-label="step down"
          onClick={onStep.bind(null, type, 'down')}
        />
      </aside>
    );
  };

  const emphasisInfo = () => {
    return (
      <div className={classes.block}>
        <section>
          <span className={classes.title}>
            <span>{lang('global.emphasis')}</span>
            <span style={{color: 'white'}}>
              {state.multipleEmphasis ? lang('global.multiple') : ''}
            </span>
          </span>
        </section>
        <div className={classes.sectionContainer}>
          <section style={{flex: 'auto', maxWidth: '50%'}}>
            <span className={classes.label}>{lang('global.intensity')}</span>
            <div className={classes.inputContainer}>
              <input
                type="text"
                value={state.emphasis}
                onChange={onTextChange.bind(null, 'emphasis')}
                onBlur={onEditBlur}
                onKeyDown={onEditKeyDown.bind(null, 'emphasis')}
                onFocus={onEditFocus.bind(null, 'emphasis')}
              />
              {stepperFor('emphasis')}
            </div>
          </section>
          <button
            type="button"
            className="hsbutton icon borderless unchecked"
            data-testid="delete-marker"
            style={{transform: 'translate(0, 5px)'}}
            onClick={() => onEmphasisDelete()}>
            <img
              src={require('../../../images/icon-delete.svg')}
              style={{width: '18px', height: '18px'}}
            />
          </button>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}>
          <span className={classes.label}>{lang('global.sharpness')}</span>
        </div>
        <div className={classes.sliderContainer}>
          <div style={{width: '100%'}}>
            <Slider
              className={classes.slider}
              thumbClassName={classes.thumb}
              renderTrack={renderTrack}
              renderThumb={renderThumb}
              value={state.emphasisFrequency}
              min={0}
              max={1}
              step={0.05}
              onChange={v => onSliderChange(v as number)}
              onAfterChange={onSliderCommit}
              onSliderClick={onSliderCommit}
            />
            <div
              className={classes.stepLabels}
              style={{marginTop: '6px', marginBottom: '2px', opacity: 1}}>
              {[
                {icon: FrequencyLowIcon, type: EmphasisType.Round},
                {icon: FrequencyMediumIcon, type: EmphasisType.Medium},
                {icon: FrequencyHighIcon, type: EmphasisType.Sharp},
              ].map((item, i) => (
                <div
                  key={`frequency-marker-${i}`}
                  className={classes.tag}
                  style={{width: '30px', height: '30px'}}
                  onClick={() =>
                    onSliderButton(frequencyForSharpness(item.type))
                  }>
                  <img style={{width: '100%'}} src={item.icon} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const readOnlyTime = state.multiple || activeTool === Tool.Pen;

  return (
    <div className={classes.container}>
      {state.hasEmphasis ? emphasisInfo() : null}
      <div className={classes.block}>
        <section>
          <span className={classes.title}>
            {activeTool === Tool.Pen
              ? lang('editor.position')
              : lang('editor.breakpoints', {
                  smart_count: selectedPoints.length,
                })}
          </span>
        </section>
        <div className={classes.sectionContainer}>
          <section>
            <span className={classes.label}>{lang('global.time')}</span>
            <div className={classes.inputContainer}>
              <input
                type="text"
                readOnly={readOnlyTime}
                value={
                  activeTool === Tool.Pen
                    ? timeFormat(pointDetail.time)
                    : state.time
                }
                onChange={
                  readOnlyTime ? () => {} : onTextChange.bind(null, 'time')
                }
                onBlur={readOnlyTime ? () => {} : onEditBlur}
                onKeyDown={
                  readOnlyTime ? () => {} : onEditKeyDown.bind(null, 'time')
                }
                onFocus={
                  readOnlyTime
                    ? e => e.target.select()
                    : onEditFocus.bind(null, 'time')
                }
              />
              {readOnlyTime ? null : stepperFor('time')}
            </div>
          </section>
          <section>
            <span className={classes.label}>
              {envelope === EnvelopeType.Amplitude
                ? lang('global.amplitude')
                : lang('global.frequency')}
            </span>
            <div className={classes.inputContainer}>
              <input
                type="text"
                value={
                  activeTool === Tool.Pen
                    ? pointDetail.value.toFixed(3)
                    : state.value
                }
                readOnly={activeTool === Tool.Pen}
                onChange={onTextChange.bind(null, 'value')}
                onBlur={onEditBlur}
                onKeyDown={onEditKeyDown.bind(null, 'value')}
                onFocus={
                  activeTool === Tool.Pen
                    ? e => e.target.select()
                    : onEditFocus.bind(null, 'value')
                }
              />
              {activeTool === Tool.Pen ? null : stepperFor('value')}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default React.memo(DetailEditing);
