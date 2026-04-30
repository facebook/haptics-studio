/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-lonely-if */
import React, {useCallback, useContext, useMemo} from 'react';
import Konva from 'konva';
import {Stage, Layer, Line} from 'react-konva';
import {useDispatch} from 'react-redux';

import Constants, {
  KeyboardHorizontalMovement,
  KeyboardShiftMultiplier,
  KeyboardVerticalMovement,
} from '../../../globals/constants';
import DataPoint from './DataPoint';
import {theme} from '../../../styles/theme.style';
import {timeToScreen, boundingBoxForSelection} from '../../../globals/utils';
import {useKeyboardEvent} from '../../../hooks/useKeyboardEvent';
import {useFocusArea} from '../../../hooks/useFocusArea';
import SelectionArea from './SelectionArea';
import {AppContext} from '../../../containers/App';
import BoundingBox from './BoundingBox';
import {
  EditorPointData,
  EmphasisType,
  EnvelopeType,
  FocusArea,
  Position,
  TimeLineState,
} from '../../../state/types';
import {Tool} from '../../../state/editingTools/types';
import PenToolGhost from './PenToolGhost';

import PenCursor from '../../../images/pen-cursor.svg';
import {useRenderMetadata} from '../../../hooks/useRenderMetadata';
import {useMouseInteraction} from '../../../hooks/useMouseInteraction';
import EmphasisIndicator from './EmphasisIndicator';
import FrequencySelector from './FrequencySelector';

interface Props {
  width: number;
  height: number;
  timeline: TimeLineState;
  type: EnvelopeType;
  selectedPoints: Array<number>;
  selectedEmphasis: number | undefined;
  isHoldingShift: boolean;
  mask: {start: number; end: number};
  onPointDrag: (
    deltaX: number,
    deltaY: number,
    pointType: PointType,
    ignoreShift: boolean,
  ) => void;
  onBoundingBoxMouseDown: () => void;
}

export enum PointType {
  Data = 1,
  Emphasis = 2,
  ScaleAnchorDown = 3,
  ScaleAnchorUp = 4,
  BoundingBox = 5,
  EmphasisBody = 6,
}

/**
 * Memoized wrapper that binds a point index to DataPoint's onMouseDown/onMouseUp.
 * Without this, every point in the list receives new arrow functions on every
 * render, defeating DataPoint's React.memo.
 */
const DataPointWrapper = React.memo(function DataPointWrapper(props: {
  point: Position;
  pointIndex: number;
  strokeColor: string;
  opacity: number;
  isHovering: boolean;
  isInClosestPointsWindow: boolean;
  isSelected: boolean;
  onPointMouseDown: (
    index: number,
    pointType: PointType,
    event: Konva.KonvaEventObject<MouseEvent>,
  ) => void;
  onPointMouseUp: (
    index: number,
    event: Konva.KonvaEventObject<MouseEvent>,
  ) => void;
}) {
  const {pointIndex, onPointMouseDown, onPointMouseUp, ...rest} = props;

  const handleMouseDown = useCallback(
    (t: PointType, e: Konva.KonvaEventObject<MouseEvent>) =>
      onPointMouseDown(pointIndex, t, e),
    [pointIndex, onPointMouseDown],
  );
  const handleMouseUp = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => onPointMouseUp(pointIndex, e),
    [pointIndex, onPointMouseUp],
  );

  return (
    <DataPoint
      {...rest}
      isDraggingVertically={false}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    />
  );
});

/**
 * Memoized wrapper that binds a point index to EmphasisIndicator's onMouseDown/onMouseUp.
 */
const EmphasisWrapper = React.memo(function EmphasisWrapper(props: {
  amplitude: Position;
  emphasis: number;
  pointIndex: number;
  isHoldingShift: boolean;
  isSelected: boolean;
  isHovering: boolean;
  isInClosestPointsWindow: boolean;
  frequency: number;
  containerHeight: number;
  onPointMouseDown: (
    index: number,
    pointType: PointType,
    event: Konva.KonvaEventObject<MouseEvent>,
  ) => void;
  onPointMouseUp: (
    index: number,
    event: Konva.KonvaEventObject<MouseEvent>,
  ) => void;
}) {
  const {pointIndex, onPointMouseDown, onPointMouseUp, ...rest} = props;

  const handleMouseDown = useCallback(
    (t: PointType, e: Konva.KonvaEventObject<MouseEvent>) =>
      onPointMouseDown(pointIndex, t, e),
    [pointIndex, onPointMouseDown],
  );
  const handleMouseUp = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => onPointMouseUp(pointIndex, e),
    [pointIndex, onPointMouseUp],
  );

  return (
    <EmphasisIndicator
      {...rest}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    />
  );
});

/**
 * A collection of `DataPoint`s. This enables the single/multiple selection and editing of the charted points
 */
function EditablePoints(props: Props) {
  const {actions, selectors} = useContext(AppContext);
  const dispatch = useDispatch();

  const data = selectors.frame.getCurrentFrame(props.type);
  const {focus, setFocus: setPlotFocus} = useFocusArea(FocusArea.Plot);
  const isPasting = selectors.app.isPasting();
  const currentClipId = selectors.project.getCurrentClipId();
  const activeTool = selectors.editingTools.getActiveTool();
  const isTrimming = selectors.editingTools.isTrimmingEnabled();

  const {
    width,
    height,
    timeline,
    type,
    selectedPoints,
    selectedEmphasis,
    mask,
    isHoldingShift,
    onPointDrag,
    onBoundingBoxMouseDown,
  } = props;

  const renderMetadata = useRenderMetadata(width, height, timeline);

  const strokeColor =
    type === EnvelopeType.Amplitude
      ? theme.colors.plot.amplitude
      : theme.colors.plot.frequency;

  // Calculate bounding box for use in mouse interaction hook
  const boundingBoxForHook = useMemo(
    () => boundingBoxForSelection(selectedPoints, data, renderMetadata),
    [selectedPoints, data, renderMetadata],
  );

  // Helper function for adding new points
  const onNewPoint = useCallback(
    (point: Position) => {
      if (type === EnvelopeType.Amplitude) {
        dispatch(
          actions.project.addPoint({
            envelope: type,
            point: {time: point.x, amplitude: point.y},
          }),
        );
      } else {
        dispatch(
          actions.project.addPoint({
            envelope: type,
            point: {time: point.x, frequency: point.y},
          }),
        );
      }
    },
    [type, dispatch, actions],
  );

  // Use custom hook for all mouse interaction logic
  const {
    mouseInfo,
    selectionRect,
    currentSelection,
    emphasisGhost,
    emphasisPopupRef,
    containerMeasureRef,
    isPenToolEnabled,
    snapPoint,
    originPoint,
    onPointMouseDown,
    onPointMouseUp,
    onBoundingBoxMouseDown: handleBoundingBoxMouseDown,
  } = useMouseInteraction({
    renderMetadata,
    timeline,
    data,
    boundingBox: boundingBoxForHook,
    activeTool,
    isPasting,
    isTrimming,
    isHoldingShift,
    selectedPoints,
    selectedEmphasis,
    currentClipId,
    type,
    selectors,
    actions,
    dispatch,
    setPlotFocus,
    onPointDrag,
    onNewPoint,
  });

  // Recalculate bounding box based on currentSelection from hook
  const boundingBox = useMemo(
    () => boundingBoxForSelection([...currentSelection], data, renderMetadata),
    [currentSelection, data, renderMetadata],
  );

  // Keyboard navigation handler
  const keydown = useCallback(
    (event: KeyboardEvent) => {
      if (focus === FocusArea.Plot && selectedPoints.length > 0) {
        switch (event.key) {
          case 'Backspace':
          case 'Delete':
            dispatch(
              actions.project.deletePoints({
                envelope: type,
                indexes: selectedPoints,
              }),
            );
            break;
          case 'ArrowRight':
            onPointDrag(
              event.shiftKey
                ? KeyboardHorizontalMovement * KeyboardShiftMultiplier
                : KeyboardHorizontalMovement,
              0,
              PointType.Data,
              true,
            );
            break;
          case 'ArrowLeft':
            onPointDrag(
              event.shiftKey
                ? -KeyboardHorizontalMovement * KeyboardShiftMultiplier
                : -KeyboardHorizontalMovement,
              0,
              PointType.Data,
              true,
            );
            break;
          case 'ArrowDown':
            onPointDrag(
              0,
              event.shiftKey
                ? KeyboardVerticalMovement * KeyboardShiftMultiplier
                : KeyboardVerticalMovement,
              PointType.Data,
              true,
            );
            break;
          case 'ArrowUp':
            onPointDrag(
              0,
              event.shiftKey
                ? -KeyboardVerticalMovement * KeyboardShiftMultiplier
                : -KeyboardVerticalMovement,
              PointType.Data,
              true,
            );
            break;
          default:
            break;
        }
      }
    },
    [selectedPoints, type, onPointDrag, focus, dispatch, actions],
  );
  useKeyboardEvent('keydown', keydown);

  // Bounding box mouse down handler that also notifies parent
  const onBoundingBoxMouseDownWrapper = useCallback(
    (pointType: PointType) => {
      handleBoundingBoxMouseDown(pointType);
      if (
        pointType === PointType.ScaleAnchorDown ||
        pointType === PointType.ScaleAnchorUp
      ) {
        onBoundingBoxMouseDown();
      }
    },
    [handleBoundingBoxMouseDown, onBoundingBoxMouseDown],
  );

  const onEmphasisFrequencyChange = useCallback(
    (emphasisType: EmphasisType) => {
      dispatch(actions.project.setEmphasisType({type: emphasisType}));
    },
    [dispatch, actions],
  );

  const onEmphasisDelete = useCallback(() => {
    if (selectedEmphasis === undefined) return;
    dispatch(actions.project.removeEmphasisOnPoint({index: selectedEmphasis}));
  }, [selectedEmphasis, dispatch, actions]);

  if (width === 0) {
    return null;
  }

  let cursor: string | undefined;
  if (isPenToolEnabled) {
    cursor = `url(${PenCursor}), auto`;
  }

  const lastPoint = timeToScreen(
    data.length > 0 ? data[data.length - 1] : {x: 0, y: 0},
    renderMetadata,
  );
  const emphasisGhostPosition = emphasisGhost
    ? timeToScreen(emphasisGhost, renderMetadata)
    : undefined;
  const emphasisIntensity = emphasisGhost
    ? timeToScreen({x: 0, y: emphasisGhost.emphasis?.y ?? 0}, renderMetadata).y
    : undefined;

  let frequencySelectorPosition: Position | undefined;
  let frequencySelectorValue: number | undefined;
  if (selectedEmphasis !== undefined && data.length > 0) {
    const relativeEmphasisIndex = selectedEmphasis - data[0].index;
    if (relativeEmphasisIndex < data.length && data[relativeEmphasisIndex]) {
      frequencySelectorPosition = timeToScreen(
        {
          x: data[relativeEmphasisIndex].x,
          y: data[relativeEmphasisIndex].emphasis?.y ?? 0,
        },
        renderMetadata,
      );
      frequencySelectorValue =
        data[relativeEmphasisIndex].emphasis?.frequency ?? 0;
    }
  }

  const renderedPointData = (
    point: EditorPointData,
    index: number,
    pointType: PointType.Data | PointType.Emphasis,
  ) => {
    if (!renderMetadata.duration) return null;

    if (
      isPenToolEnabled &&
      mouseInfo.hover.adjacentPoints.match?.index === index
    ) {
      return null;
    }

    if (pointType === PointType.Emphasis && !point.emphasis) return null;

    const p = timeToScreen(point, renderMetadata);
    const emphasis = point.emphasis
      ? timeToScreen({x: point.x, y: point.emphasis.y}, renderMetadata).y
      : 0;
    const isSelected = currentSelection.has(point.index);

    if (p.x < -Constants.plot.point.radius / 2 || p.x > renderMetadata.width)
      return null;

    const isInClosestPointsWindow = mouseInfo.hover.closestPoints.has(index);
    const limitPasteLeft = timeToScreen({x: mask.start, y: 0}, renderMetadata);
    const limitPasteRight = timeToScreen({x: mask.end, y: 0}, renderMetadata);
    const opacity = p.x > limitPasteLeft.x && p.x < limitPasteRight.x ? 0 : 1;

    return pointType === PointType.Data ? (
      <DataPointWrapper
        key={`data-${index}`}
        point={p}
        pointIndex={point.index}
        strokeColor={strokeColor}
        opacity={opacity}
        isHovering={mouseInfo.hover.hoveredPointIndex === point.index}
        isInClosestPointsWindow={isInClosestPointsWindow}
        isSelected={isSelected}
        onPointMouseDown={onPointMouseDown}
        onPointMouseUp={onPointMouseUp}
      />
    ) : (
      <EmphasisWrapper
        key={`emphasis-${index}`}
        amplitude={p}
        emphasis={emphasis}
        pointIndex={point.index}
        isHoldingShift={isHoldingShift}
        isSelected={isSelected}
        isHovering={mouseInfo.hover.hoveredPointIndex === point.index}
        isInClosestPointsWindow={isInClosestPointsWindow}
        frequency={point.emphasis?.frequency ?? 0}
        containerHeight={renderMetadata.height}
        onPointMouseDown={onPointMouseDown}
        onPointMouseUp={onPointMouseUp}
      />
    );
  };

  return (
    <div ref={containerMeasureRef} style={cursor ? {cursor} : {}}>
      <Stage
        x={Constants.plot.margin.left}
        width={width}
        height={height + Constants.plot.margin.bottom}>
        <SelectionArea
          x={0}
          y={Constants.plot.margin.top}
          width={renderMetadata.width}
          height={height}
          selection={selectionRect}
        />

        <Layer y={Constants.plot.margin.top}>
          {frequencySelectorPosition !== undefined &&
          frequencySelectorPosition.x >= 0 &&
          frequencySelectorPosition.x <= width ? (
            <FrequencySelector
              ref={emphasisPopupRef as any}
              x={frequencySelectorPosition.x}
              y={
                frequencySelectorPosition.y -
                Constants.plot.emphasis.mouseTargetWidth * 2
              }
              frequency={frequencySelectorValue ?? 0}
              onFrequencyChange={onEmphasisFrequencyChange}
              onEmphasisDelete={onEmphasisDelete}
            />
          ) : null}
          {isPenToolEnabled ||
          (emphasisGhostPosition &&
            emphasisIntensity &&
            emphasisGhostPosition.y === emphasisIntensity) ? (
            <PenToolGhost
              renderMetadata={renderMetadata}
              mouseInfo={mouseInfo}
              hasData={data.length > 0}
              originPoint={originPoint}
              snapPoint={snapPoint}
              strokeColor={strokeColor}
              clipContent
              isHoldingShift={isHoldingShift || activeTool === Tool.Emphasis}
            />
          ) : null}

          {/* Amplitude Dots */}
          {focus === FocusArea.Navigator
            ? null
            : data.map((point, index) =>
                renderedPointData(point, index, PointType.Data),
              )}

          {/* Emphasis Dots */}
          {focus === FocusArea.Navigator
            ? null
            : data.map((point, index) =>
                renderedPointData(point, index, PointType.Emphasis),
              )}

          {emphasisGhostPosition && emphasisIntensity !== undefined ? (
            <EmphasisIndicator
              amplitude={emphasisGhostPosition}
              emphasis={emphasisIntensity}
              frequency={1}
              containerHeight={renderMetadata.height}
            />
          ) : null}
          {emphasisGhostPosition &&
          emphasisIntensity !== undefined &&
          emphasisGhostPosition.x > lastPoint.x ? (
            <Line
              transformsEnabled="position"
              perfectDrawEnabled={false}
              listening={false}
              points={[
                lastPoint.x,
                lastPoint.y,
                emphasisGhostPosition.x,
                emphasisGhostPosition.y,
              ]}
              stroke={strokeColor}
              strokeWidth={1}
            />
          ) : null}
        </Layer>

        <Layer y={Constants.plot.margin.top}>
          {selectionRect === undefined && boundingBox ? (
            <BoundingBox
              selection={boundingBox}
              onMouseDown={onBoundingBoxMouseDownWrapper}
            />
          ) : null}
        </Layer>
      </Stage>
    </div>
  );
}

export default React.memo(EditablePoints);
