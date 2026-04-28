/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable react/prop-types */
import React, {useEffect, useMemo} from 'react';
import Slider from 'react-slider';
import {createAppStyle, theme} from '../../../styles/theme.style';
import {
  sectionHeader,
  sliderContainer,
  sliderThumb,
} from '../../../styles/shared.styles';
import ToggleSwitch from '../../common/ToggleSwitch';
import {
  AnalysisSettings,
  AnalyzerParameter,
  AnalyzerParameterGroup,
  EnvelopeType,
  ParameterValues,
} from '../../../state/types';
import {
  createRenderThumb,
  createRenderTrack,
} from '../../common/SliderRenderers';

const useStyles = createAppStyle(theme => ({
  group: {
    '&.disabled': {
      opacity: 0.3,
      pointerEvents: 'none',
    },
  },
  header: {
    ...sectionHeader(theme),
  },
  item: {
    color: theme.colors.text.primary,
  },
  title: {
    display: 'flex',
    justifyContent: 'space-between',
    color: theme.colors.text.primary,
    fontSize: '13px',
    lineHeight: '18px',
    fontWeight: 500,
    letterSpacing: '0.2px',
    marginTop: '8px',
  },
  sliderContainer: {
    ...sliderContainer,
  },
  metaSliderContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  slider: {
    height: '20px',
    display: 'flex',
    flex: '1',
    alignItems: 'center',
    margin: '2px 0 12px 0',
  },
  disabled: {
    opacity: 0.5,
  },
  thumb: {
    ...sliderThumb(theme),
  },
  stepLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    '& span': {
      marginTop: '-8px',
    },
  },
  valueLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    '& span': {
      marginTop: '-12px',
    },
  },
  sliderLabel: {
    fontSize: '12px',
    color: theme.colors.text.sliderLabel,
  },
}));

interface AudioAnalyzerGroupProps {
  group: AnalyzerParameterGroup;
  parameters: AnalysisSettings;
  values: ParameterValues;
  onValuesChange: (values: ParameterValues) => void;
  onValuesCommit: (
    keys: string[],
    values: ParameterValues | undefined,
    group: EnvelopeType,
  ) => void;
  disabled: boolean;
}

/**
 * A list of parameters for the audio analysis. Parameters are configured externally with the `AudioAnalyzerConfigs.json` file
 * @param props.group the group to display
 * @param props.parameters the parameters metadata
 * @param props.values the local state with the values changed by the user. The object's key is the parameter key
 * @param props.onValuesChange the setter for the state
 * @param props.onValuesCommit called when the interaction with a slider is complete (mouse/touch up)
 * @param props.disabled if the group is disabled
 */
function AudioAnalyzerGroup(
  props: AudioAnalyzerGroupProps,
): JSX.Element | null {
  const classes = useStyles();
  const {group, parameters} = props;

  if (process.env.NODE_ENV === 'production' && group.debugOnly) {
    return null;
  }

  return (
    <div className={`${classes.group} ${props.disabled ? 'disabled' : ''}`}>
      <div>
        <div className={classes.header}>{group.title}</div>
        {group.items.map((key: string) => {
          const parameter = props.parameters[key];
          if (process.env.NODE_ENV === 'production' && parameter.debugOnly) {
            return null;
          }

          return (
            <Parameter
              color={group.color}
              groupType={group.type}
              key={key}
              item={parameter}
              parameterKey={key}
              parameters={parameters}
              values={props.values}
              onValuesChange={props.onValuesChange}
              onValuesCommit={props.onValuesCommit}
            />
          );
        })}
      </div>
    </div>
  );
}

interface ParameterProps {
  item: AnalyzerParameter;
  parameterKey: string;
  groupType: string;
  parameters: AnalysisSettings;
  color: string;
  values: ParameterValues;
  onValuesChange: (values: ParameterValues) => void;
  onValuesCommit: (
    keys: string[],
    values: ParameterValues | undefined,
    group: EnvelopeType,
  ) => void;
}

/**
 * Renders a single audio parameter
 * @param props.item the analysis parameter object
 * @param props.parameterKey the parameter key
 * @param props.groupType the type of envelope it relates to
 * @param props.parameters the full parameters collection, required by single params that reference others like ranges
 * @param props.color the parameter color
 * @param props.values the local state with the values changed by the user. The object's key is the parameter key
 * @param props.onValuesChange the setter for the state
 * @param props.onValuesCommit called when the interaction with a slider is complete (mouse/touch up)
 */
function Parameter(props: ParameterProps) {
  const classes = useStyles();
  const {
    parameters,
    color,
    item,
    values,
    onValuesChange,
    onValuesCommit,
    parameterKey,
    groupType,
  } = props;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const sliderRef = React.useRef<InstanceType<typeof Slider>>(null);

  // The react-slider requires a manual resize when the parent changes
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined' || !containerRef.current) {
      return;
    }
    const resizeObserver = new ResizeObserver(() => {
      if (sliderRef.current) {
        (sliderRef.current as unknown as {resize: () => void}).resize();
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  });

  const onChackboxChange = (key: string) => {
    onValuesChange({...values, [key]: values[key] === 0 ? 1 : 0});
  };

  const onSliderChange = (key: string, value: number) => {
    onValuesChange({...values, [key]: value});
  };

  const onMetaChange = (value: number) => {
    const newValues = {...values};
    if (item.steps) {
      const step = item.steps[value];
      if (step) {
        Object.keys(step.values).forEach(k => {
          newValues[k] = step.values[k];
          if (typeof newValues[k] === 'boolean') {
            newValues[k] = newValues[k] ? 1 : 0;
          }
        });
      }
    }
    onValuesChange(newValues);
  };

  const onRangeChange = (_key: string, changes: number[]) => {
    const minKey = parameters[parameterKey].minRef ?? '';
    const maxKey = parameters[parameterKey].maxRef ?? '';
    onValuesChange({...values, [minKey]: changes[0], [maxKey]: changes[1]});
  };

  const onSliderCommit = () => {
    if (item.type === 'range') {
      const maxKey = parameters[parameterKey].maxRef;
      const minKey = parameters[parameterKey].minRef;
      if (minKey && maxKey) {
        onValuesCommit([minKey, maxKey], undefined, groupType as EnvelopeType);
      }
    } else {
      onValuesCommit([parameterKey], undefined, groupType as EnvelopeType);
    }
  };

  // Check if the parameter depends from another one. In that case check if the dependency is enabled
  const isDisabled = item.dependsOn ? !values[item.dependsOn] : false;

  const renderTrack = useMemo(() => createRenderTrack(color), [color]);
  const renderRangeTrack = useMemo(() => createRenderTrack(color, 1), [color]);
  const renderThumb = useMemo(() => createRenderThumb(color), [color]);

  const renderSlider = () => {
    switch (item.type) {
      case 'meta':
        return (
          <div style={{width: '100%'}}>
            <Slider
              ref={sliderRef}
              disabled={isDisabled}
              className={`${classes.slider} ${isDisabled ? classes.disabled : ''}`}
              thumbClassName={classes.thumb}
              renderTrack={renderTrack}
              renderThumb={renderThumb}
              defaultValue={0}
              min={0}
              max={
                item.steps && item.steps.length > 0 ? item.steps?.length - 1 : 0
              }
              step={1}
              onChange={v => onMetaChange(v as number)}
              onAfterChange={onSliderCommit}
              onSliderClick={onSliderCommit}
            />
            <div className={classes.stepLabels}>
              {item.steps?.map((step, idx) => (
                <span className={classes.sliderLabel} key={`step-${idx}`}>
                  {step.name}
                </span>
              ))}
            </div>
          </div>
        );
      case 'range': {
        const minKey = parameters[parameterKey].minRef ?? '';
        const maxKey = parameters[parameterKey].maxRef ?? '';
        const minParam = parameters[minKey];
        const maxParam = parameters[maxKey];

        return (
          <div style={{width: '100%'}}>
            <Slider
              ref={sliderRef}
              disabled={isDisabled}
              className={`${classes.slider} ${isDisabled ? classes.disabled : ''}`}
              thumbClassName={classes.thumb}
              renderTrack={renderRangeTrack}
              renderThumb={renderThumb}
              value={[
                values[minKey] ?? (minParam.default as number) ?? 0,
                values[maxKey] ?? (maxParam.default as number) ?? 0,
              ]}
              min={(minParam.min as number) ?? 0}
              max={(maxParam.max as number) ?? 1}
              step={minParam.step}
              onChange={v => onRangeChange(props.parameterKey, v as number[])}
              onAfterChange={onSliderCommit}
              onSliderClick={onSliderCommit}
            />
            <div className={classes.valueLabels}>
              {[
                minParam.overrideLabel ?? minParam.min,
                maxParam.overrideLabel ?? maxParam.max,
              ].map((value, idx) => (
                <span
                  className={classes.sliderLabel}
                  key={`value-${idx}`}>{`${value ?? ''} ${item.measure ?? ''}`}</span>
              ))}
            </div>
          </div>
        );
      }
      default:
        return (
          <div style={{width: '100%', position: 'relative'}}>
            <Slider
              ref={sliderRef}
              disabled={isDisabled}
              className={`${classes.slider} ${isDisabled ? classes.disabled : ''}`}
              thumbClassName={classes.thumb}
              renderTrack={renderTrack}
              renderThumb={renderThumb}
              value={values[props.parameterKey]}
              defaultValue={props.item.default as number}
              min={item.min ?? 0}
              max={item.max ?? 1}
              step={item.step}
              onChange={v => onSliderChange(props.parameterKey, v as number)}
              onAfterChange={onSliderCommit}
              onSliderClick={onSliderCommit}
            />
            <div className={classes.valueLabels}>
              {[item.min, item.max].map((value, idx) => (
                <span
                  className={classes.sliderLabel}
                  key={`value-${idx}`}>{`${value ?? ''} ${item.measure ?? ''}`}</span>
              ))}
            </div>
          </div>
        );
    }
  };

  const renderValue = () => {
    switch (item.type) {
      case 'meta':
        return null;
      case 'range': {
        const minKey = parameters[parameterKey].minRef ?? '';
        const maxKey = parameters[parameterKey].maxRef ?? '';
        const minValue = values[minKey] as number | undefined;
        const maxValue = values[maxKey] as number | undefined;
        const minParam = parameters[minKey];
        const maxParam = parameters[maxKey];
        const usePercentage =
          parameters[minKey].overrideLabel !== undefined ||
          parameters[maxKey].overrideLabel !== undefined;
        return (
          <div
            className={classes.sliderLabel}
            style={{color: theme.colors.text.primary}}>
            {usePercentage
              ? `${Math.ceil((minValue || (minParam.default as number)) * 100)}% - ${Math.ceil((maxValue || (maxParam.default as number)) * 100)}%`
              : `${minValue || (minParam.default as number)} ${item.measure ?? ''} - ${maxValue || (maxParam.default as number)} ${item.measure ?? ''}`}
          </div>
        );
      }
      default:
        return (
          <div
            className={classes.sliderLabel}
            style={{color: theme.colors.text.primary}}>
            {`${(values[props.parameterKey] as number) ?? (item.default as number)} ${item.measure ?? ''}`}
          </div>
        );
    }
  };

  return (
    <div ref={containerRef}>
      {item.type === 'boolean' ? (
        <ToggleSwitch
          checked={values[props.parameterKey] !== 0}
          onChange={onChackboxChange.bind(null, props.parameterKey)}>
          {item.title}
        </ToggleSwitch>
      ) : (
        <div className={classes.item}>
          <div className={classes.title}>
            <span>{item.title}</span>
            {renderValue()}
          </div>
          <div
            className={
              item.type === 'meta'
                ? classes.metaSliderContainer
                : classes.sliderContainer
            }>
            {renderSlider()}
          </div>
        </div>
      )}
    </div>
  );
}

export default AudioAnalyzerGroup;
