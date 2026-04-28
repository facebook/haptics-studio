/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useContext, useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';
import {debounce, isEqual} from 'lodash';

import {createAppStyle} from '../../../styles/theme.style';
import {AppContext} from '../../../containers/App';
import parameters from '../../../globals/AudioAnalyzerConfig.json';
import Spinner from '../../common/Spinner';
import AudioAnalyzerGroup from './AudioAnalyzerGroup';
import {
  AnalyzerParameter,
  EnvelopeType,
  ParameterValues,
} from '../../../state/types';
import {getEmptyClip} from '../../../state/project/selectors';

import ToastInfo from '../../../images/toast-info.svg';

const useStyles = createAppStyle(theme => ({
  container: {
    height: '100%',
    backgroundColor: theme.colors.background.dark,
    borderRadius: theme.spacing.sm,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    position: 'relative',
    margin: theme.spacing.sm,
    gap: theme.spacing.sm,
    '&.disabled': {
      pointerEvents: 'none',
      opacity: 0.2,
    },
    '&.highlighted': {
      boxShadow: '0px 0px 0px 2px #263951',
    },
    '& section': {
      padding: '2px 6px',
      borderRadius: theme.sizes.borderRadius.card,
    },
  },
  label: {
    ...theme.typography.small,
    fontWeight: 500,
    color: theme.colors.text.primary,
    paddingLeft: theme.spacing.md,
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '30px',
    '& aside': {
      fontSize: '12px',
      lineHeight: '11px',
      color: theme.colors.text.secondary,
    },
  },
  actions: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.sm,
    borderRadius: theme.sizes.borderRadius.roundedCard,
    backgroundColor: theme.colors.background.tag,
  },
  loading: {
    zIndex: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    background: `${theme.colors.background.dark}CC`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
}));

function AudioAnalyzer() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const {actions, selectors, lang} = useContext(AppContext);
  const emptyClip = getEmptyClip();
  const currentClip = selectors.project.getCurrentClip() ?? emptyClip;
  const currentClipId = selectors.project.getCurrentClipId();
  const selectedClips = selectors.project.getSelectedClipsWithAudio();

  const {audio, loading, hasChanges} = currentClip;
  const {dsp} = currentClip?.state.present;

  const defaultSettings = React.useMemo(() => {
    const defaultValues: ParameterValues = {};
    Object.keys(parameters.parameters).forEach((k: string) => {
      const param: AnalyzerParameter = (parameters.parameters as any)[
        k
      ] as AnalyzerParameter;
      if (param.type !== 'range') {
        defaultValues[k] = param.default;
      }
    });
    return defaultValues;
  }, []);
  const [settings, setSettings] = useState<ParameterValues>({});
  const [currentSettings, setCurrentSettings] = useState<ParameterValues>({});

  useEffect(() => {
    if (currentClipId) {
      // Merge the default values with the settings
      const newSettings = {...defaultSettings, ...dsp};
      setSettings(newSettings);
      setCurrentSettings(newSettings);
    }
  }, [currentClipId, dsp]);

  const onValuesCommit = debounce(
    (keys: string[], values: any | undefined, group: EnvelopeType) => {
      const data = values ?? settings;
      const haveSettingsChanged = !isEqual(data, currentSettings);
      const settingsChange: {[key: string]: number} = {};
      keys.forEach(key => {
        settingsChange[key] = data[key];
      });
      if (
        !loading &&
        audio &&
        audio.path &&
        currentClipId &&
        haveSettingsChanged
      ) {
        if (selectedClips.length > 1) {
          dispatch(
            actions.app.showDialog({
              title: lang('editor.analysis-multiple'),
              text: lang('editor.analysis-multiple-body'),
              confirmButton: lang('editor.analysis-multiple-button'),
              action: actions.project.batchAudioAnalysis({
                clipIds: selectedClips,
                settingsChange,
                group,
              }),
            }),
          );
        } else if (hasChanges[group]) {
          dispatch(
            actions.app.showDialog({
              title: lang('editor.analysis-confirm'),
              text: lang('editor.analysis-confirm-body'),
              confirmButton: lang('editor.analysis-confirm-button'),
              action: actions.project.updateAudioAnalysis({
                clipId: currentClipId,
                settingsChange,
                group,
              }),
            }),
          );
        } else {
          dispatch(
            actions.project.updateAudioAnalysis({
              clipId: currentClipId,
              settingsChange,
              group,
            }),
          );
        }
      }
    },
    50,
    {leading: false, trailing: true},
  );

  const updateSettings = (payload: any) => {
    setSettings(payload);
  };

  const multipleClips = selectedClips.length > 1;
  const analyzerDisabled = Boolean(
    currentClipId && !loading && !audio?.exists && audio?.path,
  );

  return (
    <aside
      className={`${classes.container} ${!currentClipId || currentClip.failed ? 'disabled' : ''}`}>
      {multipleClips ? (
        <>
          <div className={classes.actions}>
            <img src={ToastInfo} style={{width: '30px', height: '30px'}} />
            <span className={classes.label} style={{marginRight: 'auto'}}>
              {lang('editor.batch-analyzer-title')}
            </span>
          </div>
        </>
      ) : null}
      {audio?.path || !currentClipId ? (
        <>
          <section>
            <AudioAnalyzerGroup
              key="group-amplitude"
              disabled={analyzerDisabled}
              group={parameters.groups[0]}
              parameters={parameters.parameters}
              values={settings}
              onValuesChange={updateSettings}
              onValuesCommit={onValuesCommit}
            />
            <AudioAnalyzerGroup
              key="group-emphasis"
              disabled={analyzerDisabled}
              group={parameters.groups[1]}
              parameters={parameters.parameters}
              values={settings}
              onValuesChange={updateSettings}
              onValuesCommit={onValuesCommit}
            />
          </section>
          <div className="rldsspacer" />
          <section>
            <AudioAnalyzerGroup
              key="group-frequency"
              disabled={analyzerDisabled}
              group={parameters.groups[2]}
              parameters={parameters.parameters}
              values={settings}
              onValuesChange={updateSettings}
              onValuesCommit={onValuesCommit}
            />
          </section>
        </>
      ) : null}
      {currentClipId &&
      (loading || !currentClip.state.present.haptic) &&
      !currentClip.failed ? (
        <div className={classes.loading}>
          <Spinner />
        </div>
      ) : null}
    </aside>
  );
}

export default React.memo(AudioAnalyzer);
