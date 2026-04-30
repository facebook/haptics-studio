/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import Konva from 'konva';

import Constants, {
  BoundingBoxPadding,
  PenToolMovePointTolerance,
} from '../globals/constants';
import {useToolMouseEvent} from './useToolMouseEvent';
import {
  plotHoverState,
  screenToTime,
  snapPointInData,
  newEmphasisPointData,
} from '../globals/utils';
import useUpdateEffect from './useUpdateEffect';
import {usePlotSizing} from './usePlotSizing';
import {
  BoundingRect,
  EditorPointData,
  EnvelopeType,
  PlotHoverState,
  Position,
  RenderMetadata,
  SelectionRect,
  TimeLineState,
} from '../state/types';
import {Tool} from '../state/editingTools/types';
import {PointType} from '../components/editor/envelope/EditablePoints';
import {State} from '../state';
import {AppDispatch} from '../state/store';

export interface MouseInfo {
  position: Position;
  hover: PlotHoverState;
}

interface UseMouseInteractionParams {
  renderMetadata: RenderMetadata;
  timeline: TimeLineState;
  data: EditorPointData[];
  boundingBox: BoundingRect | undefined;
  activeTool: Tool;
  isPasting: boolean;
  isTrimming: boolean;
  isHoldingShift: boolean;
  selectedPoints: number[];
  selectedEmphasis: number | undefined;
  currentClipId: string | undefined;
  type: EnvelopeType;
  selectors: State['selectors'];
  actions: State['actionCreators'];
  dispatch: AppDispatch;
  setPlotFocus: () => void;
  onPointDrag: (
    deltaX: number,
    deltaY: number,
    pointType: PointType,
    ignoreShift: boolean,
  ) => void;
  onNewPoint: (point: Position) => void;
}

interface UseMouseInteractionReturn {
  mouseInfo: MouseInfo;
  selectionRect: SelectionRect | undefined;
  currentSelection: Set<number>;
  draggedPointType: PointType | undefined;
  emphasisGhost: EditorPointData | undefined;
  emphasisPopupRef: React.RefObject<HTMLDivElement | undefined>;
  containerMeasureRef: (node: HTMLDivElement | null) => void;
  isPenToolEnabled: boolean;
  snapPoint: Position | undefined;
  originPoint: Position;
  penMoveTolerance: number;
  onPointMouseDown: (
    index: number,
    pointType: PointType,
    event: Konva.KonvaEventObject<MouseEvent>,
  ) => void;
  onPointMouseUp: (
    index: number,
    event: Konva.KonvaEventObject<MouseEvent>,
  ) => void;
  onBoundingBoxMouseDown: (pointType: PointType) => void;
  setDraggedPointType: React.Dispatch<
    React.SetStateAction<PointType | undefined>
  >;
}

const INITIAL_MOUSE_INFO: MouseInfo = {
  position: {x: 0, y: 0},
  hover: {
    adjacentPoints: {left: undefined, right: undefined, match: undefined},
    closestPoints: new Set<number>(),
    closestEmphasis: undefined,
  },
};

/**
 * Custom hook that manages mouse interaction state and handlers for EditablePoints.
 *
 * This hook consolidates:
 * - Mouse position tracking and hover state
 * - Selection rectangle management
 * - Point dragging logic
 * - Pen tool interactions
 * - Emphasis ghost for emphasis tool
 * - Point mouse down/up handlers
 */
export function useMouseInteraction({
  renderMetadata,
  timeline,
  data,
  boundingBox,
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
}: UseMouseInteractionParams): UseMouseInteractionReturn {
  const [mouseInfo, dispatchMouseInfo] = useReducer(
    (state: MouseInfo, action: Partial<MouseInfo>): MouseInfo => ({
      ...state,
      ...action,
    }),
    INITIAL_MOUSE_INFO,
  );

  const setMouseInfo = useCallback((update: Partial<MouseInfo>) => {
    dispatchMouseInfo(update);
  }, []);

  const [emphasisGhost, setEmphasisGhost] = useState<
    EditorPointData | undefined
  >(undefined);
  const [draggedPointType, setDraggedPointType] = useState<
    PointType | undefined
  >();
  const [selectionRect, setSelectionRect] = useState<SelectionRect>();
  const [currentSelection, setCurrentSelection] = useState<Set<number>>(
    new Set(),
  );

  const isMouseDown = useRef(false);
  const didDrag = useRef(false);
  const emphasisPopupRef = useRef<HTMLDivElement>();
  const mousePosition = useRef<Position>({x: 0, y: 0});

  // Refs for frequently-changing values used in mouseMove callback.
  // This prevents the callback from being recreated on every mouse move.
  const snapPointRef = useRef<Position | undefined>(undefined);
  const currentSelectionRef = useRef(currentSelection);
  const selectionRectRef = useRef(selectionRect);
  const draggedPointTypeRef = useRef(draggedPointType);
  currentSelectionRef.current = currentSelection;
  selectionRectRef.current = selectionRect;
  draggedPointTypeRef.current = draggedPointType;

  const {
    containerMeasureRef,
    origin,
    isInsideContainer,
    relativeMousePosition,
  } = usePlotSizing(selectors);

  const penMoveTolerance = useMemo(() => {
    return (
      PenToolMovePointTolerance *
      (renderMetadata.duration / renderMetadata.width)
    );
  }, [renderMetadata.duration, renderMetadata.width]);

  const isPenToolEnabled =
    activeTool === Tool.Pen &&
    selectionRect?.x1 === undefined &&
    selectionRect?.y1 === undefined &&
    boundingBox === undefined &&
    draggedPointType === undefined &&
    mouseInfo.hover.hoveredPointIndex === undefined;

  const snapPoint = isPenToolEnabled
    ? snapPointInData(data, mouseInfo.position, renderMetadata)
    : undefined;
  snapPointRef.current = snapPoint;

  const originPoint = useMemo(
    () => ({
      x: 0,
      y: renderMetadata.height,
    }),
    [renderMetadata.height],
  );

  // Sync selection from props
  useEffect(() => {
    setCurrentSelection(new Set(selectedPoints));
  }, [selectedPoints]);

  // Clear emphasis ghost when tool changes
  useEffect(() => {
    if (activeTool !== Tool.Emphasis) {
      setEmphasisGhost(undefined);
    }
  }, [activeTool]);

  // Update hover state when timeline/data changes
  useUpdateEffect(() => {
    setMouseInfo({
      hover: plotHoverState(
        mouseInfo.position,
        data,
        renderMetadata,
        penMoveTolerance,
      ),
    });
  }, [timeline, data, renderMetadata, penMoveTolerance]);

  const isMouseOverBoundingBox = useCallback(() => {
    return (
      boundingBox &&
      boundingBox.x0 - BoundingBoxPadding <= mousePosition.current.x &&
      mousePosition.current.x <= boundingBox.x1 + BoundingBoxPadding &&
      boundingBox.y0 - BoundingBoxPadding <= mousePosition.current.y &&
      mousePosition.current.y <= boundingBox.y1 + BoundingBoxPadding
    );
  }, [boundingBox]);

  const onMouseDown = useCallback(
    (event: MouseEvent) => {
      if (isPasting || isTrimming) return;
      isMouseDown.current = true;

      if (isMouseOverBoundingBox() || !isInsideContainer(event)) return;

      setPlotFocus();

      if (mouseInfo.hover.hoveredPointIndex !== undefined) {
        return;
      }

      const pos = relativeMousePosition(event);
      setSelectionRect({x0: pos.x, y0: pos.y});
    },
    [
      isPasting,
      isTrimming,
      isMouseOverBoundingBox,
      isInsideContainer,
      setPlotFocus,
      mouseInfo.hover.hoveredPointIndex,
      relativeMousePosition,
    ],
  );

  useToolMouseEvent([Tool.Cursor, Tool.Pen], 'mousedown', onMouseDown);

  const onMouseUp = useCallback(
    (event: MouseEvent) => {
      if (isPasting || isTrimming) return;
      isMouseDown.current = false;

      if (selectedEmphasis !== undefined && emphasisPopupRef.current) {
        const selectorBounds = emphasisPopupRef.current.getBoundingClientRect();
        if (
          event.x > selectorBounds.left &&
          event.x < selectorBounds.right &&
          event.y > selectorBounds.top &&
          event.y < selectorBounds.bottom
        ) {
          return;
        }
      }

      if (emphasisGhost && isInsideContainer(event)) {
        if (emphasisGhost.index >= 0) {
          dispatch(
            actions.project.editPoints({
              envelope: EnvelopeType.Amplitude,
              points: [{...emphasisGhost}],
              select: true,
            }),
          );
        } else {
          if (data.length === 0 && emphasisGhost.x > 0) {
            onNewPoint({x: 0, y: 0});
          }
          dispatch(
            actions.project.addPoint({
              envelope: EnvelopeType.Amplitude,
              point: {
                time: emphasisGhost.x,
                amplitude: emphasisGhost.y,
                emphasis: {
                  amplitude: emphasisGhost.emphasis?.y ?? 0,
                  frequency: emphasisGhost.emphasis?.frequency ?? 0,
                },
              },
            }),
          );
        }
        setEmphasisGhost(undefined);
      }

      if (isPenToolEnabled && isInsideContainer(event)) {
        let eventPosition = relativeMousePosition(event);

        if (snapPoint) {
          eventPosition = {
            x:
              event.clientX -
              (origin?.current?.x ?? 0) -
              Constants.plot.margin.left,
            y: snapPoint.y,
          };
        }

        const newPoint = screenToTime(eventPosition, renderMetadata);

        if (data.length === 0) {
          if (eventPosition.x <= 0) {
            onNewPoint({x: 0, y: newPoint.y});
          } else {
            onNewPoint({x: 0, y: 0});
            onNewPoint(newPoint);
          }
        } else {
          if (isHoldingShift && mouseInfo.hover.adjacentPoints.match) {
            dispatch(
              actions.project.editPointsValue({
                clipId: currentClipId,
                envelope: type,
                indices: [mouseInfo.hover.adjacentPoints.match.index],
                value: newPoint.y,
              }),
            );
          } else {
            onNewPoint(newPoint);
          }
        }
      }

      if (!isPenToolEnabled && draggedPointType === undefined) {
        if (selectionRect && selectionRect.x0 && !selectionRect.x1) {
          if (selectedPoints.length > 0) {
            dispatch(
              actions.project.setSelectedPoints({
                points: [],
                emphasis: undefined,
              }),
            );
          }
        } else if (selectionRect && selectionRect.x0 && selectionRect.x1) {
          dispatch(
            actions.project.setSelectedPoints({
              points: [...currentSelection],
              emphasis: undefined,
            }),
          );
        }
      }

      setDraggedPointType(undefined);
      setSelectionRect(undefined);
    },
    [
      isPasting,
      isTrimming,
      selectedEmphasis,
      emphasisGhost,
      isInsideContainer,
      isPenToolEnabled,
      draggedPointType,
      selectionRect,
      selectedPoints,
      currentSelection,
      currentClipId,
      type,
      isHoldingShift,
      mouseInfo.hover.adjacentPoints.match,
      data,
      renderMetadata,
      snapPoint,
      origin,
      relativeMousePosition,
      dispatch,
      actions,
      onNewPoint,
    ],
  );

  const mouseMove = useCallback(
    (event: MouseEvent) => {
      if (isPasting || isTrimming) return;

      if (isMouseDown.current && event.buttons === 0) {
        onMouseUp(event);
        return;
      }

      const pos = relativeMousePosition(event);

      const constrainedPos = {
        x: Math.min(Math.max(pos.x, 0), renderMetadata.width),
        y: Math.min(Math.max(pos.y, 0), renderMetadata.height),
      };

      const hoverState = plotHoverState(
        constrainedPos,
        data,
        renderMetadata,
        isHoldingShift || activeTool === Tool.Emphasis ? penMoveTolerance : 0,
      );

      // Read from refs to avoid re-creating this callback on every mouse move
      const snap = snapPointRef.current;
      const dragType = draggedPointTypeRef.current;
      const selection = currentSelectionRef.current;
      const selRect = selectionRectRef.current;

      const cursorTime = screenToTime(
        {x: constrainedPos.x, y: snap ? snap.y : constrainedPos.y},
        renderMetadata,
      );

      if (activeTool === Tool.Pen && dragType === undefined) {
        dispatch(
          actions.app.setPointDetail({time: cursorTime.x, value: cursorTime.y}),
        );
      }

      if (selection.size > 0 && dragType) {
        const x =
          (event.movementX / renderMetadata.width) * renderMetadata.duration;
        const y = event.movementY / renderMetadata.height;
        onPointDrag(x, y, dragType, false);
        didDrag.current = true;
      }

      if (
        selRect !== undefined &&
        dragType === undefined &&
        event.buttons > 0
      ) {
        if (selRect.x0 === pos.x || selRect.y0 === pos.y) {
          return;
        }

        setSelectionRect({...selRect, x1: pos.x, y1: pos.y});

        if (selRect.x0 && selRect.x1 && selRect.y0 && selRect.y1) {
          const x0 =
            timeline.startTime +
            (Math.min(selRect.x0, selRect.x1) / renderMetadata.width) *
              renderMetadata.duration;
          const x1 =
            timeline.startTime +
            (Math.max(selRect.x0, selRect.x1) / renderMetadata.width) *
              renderMetadata.duration;
          const y0 =
            Math.min(selRect.y0, selRect.y1) / renderMetadata.height;
          const y1 =
            Math.max(selRect.y0, selRect.y1) / renderMetadata.height;

          const newSelection: Array<number> = [];
          data.forEach(point => {
            if (
              point.x >= x0 &&
              point.x <= x1 &&
              1 - point.y >= y0 &&
              1 - point.y <= y1
            ) {
              newSelection.push(point.index);
            }
            if (point.emphasis) {
              if (
                point.x >= x0 &&
                point.x <= x1 &&
                1 - point.emphasis.y >= y0 &&
                1 - point.emphasis.y <= y1
              ) {
                newSelection.push(point.index);
              }
            }
          });
          if (selection.size !== newSelection.length) {
            setCurrentSelection(new Set(newSelection));
          }
        }
      }

      if (activeTool === Tool.Emphasis) {
        setEmphasisGhost(newEmphasisPointData(hoverState, cursorTime));
      }

      setMouseInfo({
        position: constrainedPos,
        hover: hoverState,
      });

      mousePosition.current = pos;
    },
    [
      isPasting,
      isTrimming,
      relativeMousePosition,
      renderMetadata,
      data,
      isHoldingShift,
      activeTool,
      penMoveTolerance,
      timeline.startTime,
      dispatch,
      actions,
      onPointDrag,
      onMouseUp,
    ],
  );

  useToolMouseEvent(
    [Tool.Cursor, Tool.Pen, Tool.Emphasis],
    'mousemove',
    mouseMove,
  );
  useToolMouseEvent(
    [Tool.Cursor, Tool.Pen, Tool.Emphasis],
    'mouseup',
    onMouseUp,
  );

  const onPointMouseDown = useCallback(
    (
      index: number,
      pointType: PointType,
      event: Konva.KonvaEventObject<MouseEvent>,
    ) => {
      didDrag.current = false;
      if (event.evt.shiftKey) {
        if (!selectedPoints.includes(index)) {
          dispatch(
            actions.project.setSelectedPoints({
              clipId: currentClipId,
              points: [...selectedPoints, index],
              emphasis: pointType === PointType.Emphasis ? index : undefined,
            }),
          );
        }
      } else {
        dispatch(
          actions.project.setSelectedPoints({
            clipId: currentClipId,
            points: [index],
            emphasis: pointType === PointType.Emphasis ? index : undefined,
          }),
        );
      }
      setDraggedPointType(pointType);
    },
    [selectedPoints, currentClipId, dispatch, actions],
  );

  const onPointMouseUp = useCallback(
    (index: number, event: Konva.KonvaEventObject<MouseEvent>) => {
      if (didDrag.current) {
        return;
      }

      if (
        !event.evt.shiftKey &&
        selectedPoints.length > 1 &&
        selectedPoints.includes(index)
      ) {
        dispatch(
          actions.project.setSelectedPoints({
            clipId: currentClipId,
            points: [index],
          }),
        );
      }
    },
    [selectedPoints, currentClipId, dispatch, actions],
  );

  const onBoundingBoxMouseDown = useCallback((pointType: PointType) => {
    setDraggedPointType(pointType);
  }, []);

  return {
    mouseInfo,
    selectionRect,
    currentSelection,
    draggedPointType,
    emphasisGhost,
    emphasisPopupRef: emphasisPopupRef as React.RefObject<
      HTMLDivElement | undefined
    >,
    containerMeasureRef,
    isPenToolEnabled,
    snapPoint,
    originPoint,
    penMoveTolerance,
    onPointMouseDown,
    onPointMouseUp,
    onBoundingBoxMouseDown,
    setDraggedPointType,
  };
}
