/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {createAppStyle} from '../../styles/theme.style';

const useStyles = createAppStyle(theme => ({
  tooltip: {
    fontWeight: 400,
    fontSize: '12px',
    position: 'fixed',
    padding: '4px 8px',
    display: 'flex',
    gap: '4px',
    color: theme.colors.text.secondary,
    borderRadius: theme.sizes.borderRadius.tooltip,
    backgroundColor: theme.colors.background.dark,
    whiteSpace: 'nowrap',
    '& section': {
      color: theme.colors.text.primary,
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: '100%',
      left: '50%',
      marginLeft: '-5px',
      borderWidth: '5px',
      borderStyle: 'solid',
      borderColor: `transparent transparent ${theme.colors.background.dark} transparent`,
    },
  },
}));

interface Props {
  text: string;
  top: number;
  shortcut?: string;
  style?: React.CSSProperties;
}

function Tooltip(props: Props) {
  const classes = useStyles();

  return (
    <figcaption
      style={{top: `${props.top + 5}px`, position: 'fixed', ...props.style}}
      className={classes.tooltip}>
      {props.text}
      {props.shortcut ? <section>{props.shortcut}</section> : null}
    </figcaption>
  );
}

Tooltip.defaultProps = {
  shortcut: undefined,
  styles: undefined,
};

export default React.memo(Tooltip);
