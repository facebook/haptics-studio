/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable react/no-danger */

import React, {useContext, useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';
import {clipboard} from 'electron';
import {IpcInvokeChannel} from '../../../../shared';
import {typedInvoke} from '../../../../shared/typed-ipc';

import {createAppStyle} from '../../styles/theme.style';
import {AppContext} from '../../containers/App';
import {useStyles as useInputStyles} from '../editor/rightpanel/RightPanelTools.styles';
import DropdownMenu from './DropdownMenu';

const useStyles = createAppStyle(theme => ({
  options: {
    display: 'flex',
    flexDirection: 'column',
    '& div': {
      display: 'flex',
      flexDirection: 'column',
    },
  },
  language: {
    display: 'flex',
    justifyContent: 'center',
    background: theme.colors.background.body,
    borderRadius: theme.sizes.borderRadius.card,
    border: `1px solid ${theme.colors.input.border}`,
    color: theme.colors.text.secondary,
    padding: '0px 28px 0px 8px',
    height: '36px',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    gap: theme.spacing.sm,
    height: '50px',
  },
}));

type RawLanguage = 'java' | 'kotlin' | 'json';

interface RawOptions {
  gain: number;
  sampleRate: number;
  language: RawLanguage;
}

interface RawData {
  [key: string]: {
    amplitudes: number[];
    timings: number[];
  };
}

function sanitizeVariableName(name: string): string {
  const words = name
    .replace(/[^a-zA-Z0-9\s_]/g, '')
    .split(/[\s_]+/)
    .filter(word => word.length > 0);

  if (words.length === 0) {
    return 'clip';
  }

  const camelCased = words
    .map((word, index) =>
      index === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join('');

  if (/^[0-9]/.test(camelCased)) {
    return 'clip' + camelCased.charAt(0).toUpperCase() + camelCased.slice(1);
  }

  return camelCased;
}

/**
 * Component for the Android data export
 */
export default function AndroidExport(): JSX.Element {
  const inputClasses = useInputStyles();
  const classes = useStyles();
  const dispatch = useDispatch();

  const {actions, selectors, lang} = useContext(AppContext);
  const selectedClips = selectors.project.getSelectedClips();

  const [options, setOptions] = useState<RawOptions>({
    gain: 1.0,
    sampleRate: 100,
    language: 'kotlin',
  });
  const [sampleRateText, setSampleRateText] = useState<string>(
    `${options.sampleRate}`,
  );
  const [gainText, setGainText] = useState<string>(`${options.gain}`);
  const [data, setData] = useState<RawData>({});
  const [text, setText] = useState('');
  const [language, setLanguage] = useState<RawLanguage>('json');

  const updatePreview = async () => {
    const res = await typedInvoke(IpcInvokeChannel.RawExportPreview, {
      clips: selectedClips,
      gain: options.gain,
      sampleRate: options.sampleRate,
    });
    if (res && res.status === 'ok' && res.payload) {
      setData(res.payload);
    }
  };

  useEffect(() => {
    let text = '';
    Object.keys(data).forEach(key => {
      const values = data[key];
      const variableName = sanitizeVariableName(key);
      const chunkSize = 18;
      let chunked = Array.from(
        {length: Math.ceil(values.amplitudes.length / chunkSize)},
        (_, i) =>
          values.amplitudes.slice(i * chunkSize, i * chunkSize + chunkSize),
      );
      const chunkedStr = chunked.map(v => `${v.join(', ')}`).join(',\n    ');

      chunked = Array.from(
        {length: Math.ceil(values.timings.length / chunkSize)},
        (_, i) =>
          values.timings.slice(i * chunkSize, i * chunkSize + chunkSize),
      );
      const chunkedTimingsStr = chunked
        .map(v => `${v.join(', ')}`)
        .join(',\n    ');

      switch (language) {
        case 'java':
          text += `VibrationEffect ${variableName} = VibrationEffect.createWaveform(new long[] {\n    ${chunkedTimingsStr}\n  },\n  new int[] {\n    ${chunkedStr}\n  }, -1);\n`;
          break;
        case 'kotlin':
          text += `val ${variableName} = VibrationEffect.createWaveform(\n    longArrayOf(\n      ${chunkedTimingsStr}\n    ),\n    intArrayOf(\n      ${chunkedStr}\n    ),\n    -1\n  )\n`;
          break;
        case 'json':
          text += `${JSON.stringify(values, null, 1)}\n`;
          break;
        default:
          break;
      }
    });
    setText(text);
  }, [data, language, options.sampleRate]);

  useEffect(() => {
    void updatePreview();
  }, [options.gain, options.sampleRate]);

  const onSave = () => {
    if (selectedClips) {
      if (language === 'json') {
        dispatch(
          actions.app.confirmExport({
            clips: selectedClips,
            formats: ['android'],
            packageProject: false,
            flatten: false,
            gain: options.gain,
            sampleRate: options.sampleRate,
          }),
        );
      } else {
        clipboard.writeText(text);
      }
    }
  };

  const onTextChange = (
    type: keyof typeof options,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (type === 'gain') {
      const value = e.currentTarget.value.replace(/[^0-9.,]/g, '');
      setGainText(value);
      const gain = parseFloat(value);
      if (gain >= 0 && gain <= 1) {
        setOptions({...options, gain});
      }
    } else {
      const value = e.currentTarget.value.replace(/[^0-9]/g, '');
      setSampleRateText(value);
      const sampleRate = parseInt(value, 10);
      if (sampleRate >= 1 && sampleRate <= 1000) {
        setOptions({...options, sampleRate});
      }
    }
  };

  return (
    <div>
      <div className={classes.options}>
        <div className={inputClasses.inputContainer}>
          <span className={inputClasses.label}>Gain</span>
          <input
            type="text"
            value={gainText}
            onChange={onTextChange.bind(null, 'gain')}
            onFocus={e => {
              e.target.select();
            }}
          />
        </div>
        <div className={inputClasses.inputContainer}>
          <span className={inputClasses.label}>Sample Rate</span>
          <input
            type="text"
            value={sampleRateText}
            onChange={onTextChange.bind(null, 'sampleRate')}
            onFocus={e => {
              e.target.select();
            }}
          />
        </div>
        <div className={inputClasses.inputContainer}>
          <span className={inputClasses.label}>Format</span>
          <DropdownMenu
            items={[
              {
                label: 'JSON',
                buttonTitle: 'JSON',
                onClick: () => setLanguage('json'),
              },
              {
                label: 'Java',
                buttonTitle: 'Java',
                onClick: () => setLanguage('java'),
              },
              {
                label: 'Kotlin',
                buttonTitle: 'Kotlin',
                onClick: () => setLanguage('kotlin'),
              },
            ]}>
            <div className={classes.language}>{language}</div>
          </DropdownMenu>
        </div>
      </div>
      {language !== 'json' && (
        <div className={classes.actions}>
          <button type="button" className="hsbutton" onClick={onSave}>
            {lang('export.copy-to-clipboard')}
          </button>
        </div>
      )}
    </div>
  );
}
