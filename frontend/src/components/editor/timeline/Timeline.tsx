/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {CSSProperties} from 'react';
import Konva from 'konva';

import {AppContext} from '../../../containers/App';
import Constants from '../../../globals/constants';
import {createAppStyle} from '../../../styles/theme.style';
import {ZIndex} from '../../../styles/zIndex';
import TimelineCursor from './TimelineCursor';
import TimelinePlot from './TimelinePlot';
import {
  EditorPointData,
  EnvelopeType,
  TimelineCursorType,
  TimeLineState,
} from '../../../state/types';

const useStyles = createAppStyle(theme => ({
  container: {
    borderTop: `1px solid ${theme.colors.background.dark}`,
    position: 'relative',
    '&.disabled': {
      pointerEvents: 'none',
      opacity: 0.5,
    },
    zIndex: ZIndex.Toolbar,
  },
  plot: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
}));

interface Props {
  width: number;
  disabled?: boolean;
  envelope: Array<EditorPointData>;
  amplitude: Array<EditorPointData>;
  frequency: Array<EditorPointData>;
  timeline: TimeLineState;
  selected: EnvelopeType;
  cursorType: TimelineCursorType | undefined;
  audioPlayhead?: number;
  onSelection: (
    type: TimelineCursorType,
    e: Konva.KonvaEventObject<MouseEvent>,
  ) => void;
}

/**
 * This component is the timeline with the full rendering of all the waveforms. The component allows navigation and zoom inside the file
 */
function Timeline(props: Props) {
  const {
    disabled,
    width,
    envelope,
    amplitude,
    frequency,
    timeline,
    selected,
    cursorType,
    audioPlayhead,
    onSelection,
  } = props;

  const classes = useStyles();
  const {selectors} = React.useContext(AppContext);
  const trimTime = selectors.editingTools.getTrimTime();
  const isTrimming = selectors.editingTools.isTrimmingEnabled();

  // While the user is dragging the brush we want to keep the cursor type consistent if it moves outside the hover target defined by Brush.tsx
  const cursorStyle = (): CSSProperties => {
    switch (cursorType) {
      case TimelineCursorType.Center:
        return {cursor: 'grab'};
      case TimelineCursorType.Left:
        return {cursor: 'w-resize'};
      case TimelineCursorType.Right:
        return {cursor: 'e-resize'};
      default:
        return {};
    }
  };

  const renderSize = {
    width,
    height: Constants.timeline.height,
    margin: {
      top: Constants.timeline.verticalPadding,
      right: Constants.timeline.horizontalPadding,
      bottom: Constants.timeline.verticalPadding,
      left: Constants.timeline.horizontalPadding,
    },
  };

  return (
    <div
      className={`${classes.container} ${disabled ? 'disabled' : ''}`}
      style={{...cursorStyle(), height: `${Constants.timeline.height}px`}}>
      <div className={classes.plot}>
        <TimelinePlot
          renderSize={renderSize}
          envelope={envelope}
          amplitude={amplitude}
          frequency={frequency}
          selected={selected}
          duration={timeline.duration}
          audioPlayhead={audioPlayhead}
        />
      </div>
      <div className={classes.plot}>
        {timeline.duration > 0 ? (
          <TimelineCursor
            renderSize={renderSize}
            timeline={timeline}
            isTrimming={isTrimming}
            trimTime={trimTime}
            onSelection={onSelection}
          />
        ) : null}
      </div>
    </div>
  );
}

Timeline.defaultProps = {
  disabled: false,
  audioPlayhead: undefined,
};

export default React.memo(Timeline);
