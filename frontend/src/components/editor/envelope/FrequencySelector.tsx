/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {Html} from 'react-konva-utils';

import {createAppStyle, theme} from '../../../styles/theme.style';
import {EmphasisType} from '../../../state/types';

import FrequencyLowIcon from '../../../images/frequency-low.svg';
import FrequencyMediumIcon from '../../../images/frequency-medium.svg';
import FrequencyHighIcon from '../../../images/frequency-high.svg';
import DeleteIcon from '../../../images/icon-delete.svg';
import {emphasisTypeFrom} from '../../../globals/utils';

const Icons = {
  [EmphasisType.Round]: FrequencyLowIcon,
  [EmphasisType.Medium]: FrequencyMediumIcon,
  [EmphasisType.Sharp]: FrequencyHighIcon,
};

const useStyles = createAppStyle({
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    left: '-50%',
    bottom: 0,
    backgroundColor: theme.colors.plot.emphasisFrequencySelector,
    padding: '2px',
    borderRadius: '4px',
    gap: '2px',
    height: '24px',
    '& button': {
      border: 'none',
      width: '20px',
      height: '20px',
      display: 'flex',
      alignItems: 'center',
      backgroundColor: 'transparent',
      borderRadius: '2px',
      padding: '4px',
      position: 'relative',
      '&.selected': {
        filter: 'invert(1)',
        backgroundColor: '#000',
        '&:hover': {
          backgroundColor: '#111',
        },
      },
      '&:hover': {
        backgroundColor: '#fff4',
      },
      '& aside': {
        position: 'absolute',
        bottom: '-1px',
        right: 0,
        fontSize: '8px',
        color: '#fff6',
      },
    },
  },
  divider: {
    width: '1px',
    height: '100%',
    backgroundColor: '#fff4',
  },
});

interface Props {
  x: number;
  y: number;
  frequency: number;
  onFrequencyChange: (emphasisType: EmphasisType) => void;
  onEmphasisDelete: () => void;
}

/**
 * Widget that shows the frequency type for an emphasis point and lets the user change it
 */
const FrequencySelector = React.forwardRef((props: Props, ref) => {
  const classes = useStyles();
  const currentEmphasisType = emphasisTypeFrom(props.frequency);

  const buttonFor = (emphasisType: EmphasisType) => {
    return (
      <button
        type="button"
        className={currentEmphasisType === emphasisType ? 'selected' : ''}
        onClick={() => props.onFrequencyChange(emphasisType)}>
        <img
          style={{width: '100%'}}
          src={Icons[emphasisType]}
          alt={emphasisType}
        />
      </button>
    );
  };

  return (
    <Html>
      <div style={{left: props.x, top: props.y, position: 'relative'}}>
        <div className={classes.container} ref={ref as any}>
          {buttonFor(EmphasisType.Round)}
          {buttonFor(EmphasisType.Medium)}
          {buttonFor(EmphasisType.Sharp)}
          <span className={classes.divider} />
          <button type="button" onClick={() => props.onEmphasisDelete()}>
            <img
              style={{width: '100%'}}
              src={DeleteIcon}
              alt="remove emphasis"
            />
          </button>
        </div>
      </div>
    </Html>
  );
});

export default React.memo(FrequencySelector);
