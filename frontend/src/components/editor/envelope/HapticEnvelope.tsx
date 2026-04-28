/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useState, useEffect, useContext, useCallback} from 'react';
import {useDispatch} from 'react-redux';
import {Stage, Layer} from 'react-konva';

import {createAppStyle} from '../../../styles/theme.style';
import Constants from '../../../globals/constants';
import Plot from './Plot';
import EditablePoints, {PointType} from './EditablePoints';
import {AppContext} from '../../../containers/App';
import {useMouseEvent} from '../../../hooks/useMouseEvent';
import usePointMovement from '../../../hooks/usePointMovement';
import PasteEditor from './PasteEditor';
import {
  EditorPointData,
  EnvelopeType,
  TimeLineState,
} from '../../../state/types';
import {useKeyboardEvent} from '../../../hooks/useKeyboardEvent';
import {Tool} from '../../../state/editingTools/types';

const useStyles = createAppStyle({
  plot: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

interface Props {
  className: string;
  width: number;
  height: number;
  clipboard: {
    amplitude: Array<EditorPointData>;
    frequency: Array<EditorPointData>;
  };
  timeline: TimeLineState;
  type: EnvelopeType;
  isSelected: boolean;
  selectedPoints: number[];
  selectedEmphasis: number | undefined;
  clipId: string | undefined;
}

/**
 * This component is the full plot editor, it composes the Timeline, timeline, Plot and EditablePoints components over a single view.
 */
function HapticEnvelope(props: Props) {
  const {
    className,
    width,
    height,
    timeline,
    type,
    isSelected,
    clipboard,
    selectedPoints,
    selectedEmphasis,
    clipId,
  } = props;

  const classes = useStyles();
  const dispatch = useDispatch();

  const {lang, actions, selectors} = useContext(AppContext);
  const [isEditing, setIsEditing] = useState(false);
  const [isHoldingShift, setIsHoldingShift] = useState(false);
  const {movePoints, onScaleBegin, scalePoints, onMovementMouseUp} =
    usePointMovement();
  const clipboardContent = selectors.app.getClipboard();
  const [clipboardOffset, setClipboardOffset] = useState<number | undefined>();
  const frame = selectors.frame.getCurrentFrame(type);
  const lastPointsTime = selectors.frame.getLastPointsTime();
  const activeTool = selectors.editingTools.getActiveTool();

  const hasClipboardData =
    clipboard.amplitude.length > 0 || clipboard.frequency.length > 0;
  const pasteDuration = hasClipboardData
    ? clipboard.amplitude[clipboard.amplitude.length - 1].x -
      clipboard.amplitude[0].x
    : 0;
  // If the counterpart envelope is longer, we want to render the rest of the current envelope differently
  let maxEnvelopeDuration: number | undefined =
    lastPointsTime[
      type === EnvelopeType.Frequency
        ? EnvelopeType.Amplitude
        : EnvelopeType.Frequency
    ];
  if (activeTool === Tool.Pen && isSelected) {
    maxEnvelopeDuration = undefined;
  }

  useEffect(() => {
    if (
      clipboardOffset === undefined &&
      hasClipboardData &&
      timeline.endTime > 0
    ) {
      setClipboardOffset(
        timeline.startTime +
          (timeline.endTime - timeline.startTime) / 2 -
          pasteDuration / 2,
      );
    }
  }, [clipboard, timeline]);

  /**
   * Move the selected points by a delta in both axis, while keeping the waveform shape.
   * @param deltaX the amount of movement on the X axis
   * @param deltaY the amount of movement on the Y axis
   * @param pointType the type of point (data or emphasis)
   * @param ignoreShift boolean that ignores the shift key
   */
  const onPointDrag = useCallback(
    (
      deltaX: number,
      deltaY: number,
      pointType: PointType,
      ignoreShift = false,
    ) => {
      setIsEditing(true);

      let newData: EditorPointData[] = [];
      if (
        pointType === PointType.ScaleAnchorDown ||
        pointType === PointType.ScaleAnchorUp
      ) {
        newData = scalePoints(frame, selectedPoints, deltaY, pointType);
      } else {
        const pt =
          selectedPoints.length > 1 ? PointType.BoundingBox : pointType;
        newData = movePoints(
          frame,
          timeline.duration,
          selectedPoints,
          deltaX,
          deltaY,
          pt,
          isHoldingShift,
          ignoreShift,
        );
      }

      dispatch(actions.frame.update({envelopeType: type, data: newData}));
    },
    [frame, timeline.duration, selectedPoints, isHoldingShift],
  );

  const mouseUp = useCallback(() => {
    if (isEditing) {
      onMovementMouseUp();
      dispatch(
        actions.project.editPoints({clipId, envelope: type, points: frame}),
      );
      setIsEditing(false);
    }
  }, [isEditing, type, frame, clipId]);
  useMouseEvent('mouseup', mouseUp);

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    setIsHoldingShift(e.shiftKey);
  }, []);
  useKeyboardEvent('keydown', onKeyDown);

  const onKeyUp = useCallback(() => {
    setIsHoldingShift(false);
  }, []);
  useKeyboardEvent('keyup', onKeyUp);

  const onPasteCancel = () => {
    dispatch(actions.project.cancelPaste());
    setClipboardOffset(undefined);
  };

  const onPasteConfirm = () => {
    dispatch(
      actions.project.confirmPaste({
        clipId,
        clipboard: clipboardContent,
        offset: clipboardOffset || 0,
        inPlace: false,
      }),
    );
    setClipboardOffset(undefined);
  };

  const onBoundingBoxMouseDown = () => {
    onScaleBegin(frame, selectedPoints);
  };

  return (
    <div className={className} tabIndex={0}>
      <div className={classes.plot}>
        <Stage
          x={Constants.plot.margin.left}
          y={Constants.plot.margin.top}
          width={width}
          height={height}>
          <Layer>
            <Plot
              width={width}
              height={height}
              data={frame}
              timeline={timeline}
              maxEnvelopeDuration={maxEnvelopeDuration}
              extensionText={lang('editor.extension-guidance', {
                envelope:
                  type === EnvelopeType.Amplitude
                    ? lang('global.frequency')
                    : lang('global.amplitude'),
              })}
              type={type}
              isSelected={isSelected}
              opacity={
                hasClipboardData && clipboardOffset !== undefined ? 0.5 : 1
              }
            />
          </Layer>
        </Stage>
      </div>
      {isSelected && !hasClipboardData ? (
        <div className={classes.plot}>
          <EditablePoints
            width={width}
            height={height}
            timeline={timeline}
            type={type}
            selectedPoints={selectedPoints}
            selectedEmphasis={selectedEmphasis}
            isHoldingShift={isHoldingShift}
            onPointDrag={onPointDrag}
            onBoundingBoxMouseDown={onBoundingBoxMouseDown}
            mask={{
              start:
                hasClipboardData && clipboardOffset !== undefined
                  ? clipboardOffset
                  : 0,
              end:
                hasClipboardData && clipboardOffset !== undefined
                  ? pasteDuration + clipboardOffset
                  : 0,
            }}
          />
        </div>
      ) : null}
      {hasClipboardData && isSelected && clipboardOffset !== undefined ? (
        <PasteEditor
          width={width}
          height={height}
          type={type}
          data={clipboard}
          timeline={timeline}
          offset={clipboardOffset || 0}
          setOffset={setClipboardOffset}
          onCancel={onPasteCancel}
          onConfirm={onPasteConfirm}
        />
      ) : null}
    </div>
  );
}

export default React.memo(HapticEnvelope);
