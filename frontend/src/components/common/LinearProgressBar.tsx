/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {createAppStyle, theme} from '../../styles/theme.style';

const useStyles = createAppStyle(theme => ({
  container: {
    position: 'relative',
    width: '100%',
    height: '5px',
    borderRadius: '100px',
    background: theme.colors.background.body,
  },
  progressBar: {
    maxWidth: '100%',
    minWidth: '0%',
    background: theme.colors.background.body,
    transition: 'all 0.5s',
    width: '0%',
    height: '100%',
    borderRadius: '100px',
  },
}));

interface Props {
  progress: number;
  color?: string;
  style?: React.CSSProperties;
}

function ProgressBar(props: Props) {
  const classes = useStyles();
  const {progress, color, style} = props;

  return (
    <div className={classes.container} style={style}>
      <div
        className={classes.progressBar}
        style={{
          width: `${progress}%`,
          backgroundColor: color || theme.colors.primary.main,
        }}
      />
    </div>
  );
}

ProgressBar.defaultProps = {
  color: undefined,
  style: undefined,
};

export default React.memo(ProgressBar);
