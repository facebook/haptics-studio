/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useEffect} from 'react';
import {useDispatch} from 'react-redux';
import Konva from 'konva';

import {Stage, Layer, Line, Rect, Group} from 'react-konva';
import Constants from '../../../globals/constants';
import {theme} from '../../../styles/theme.style';
import {screenToTime, timeToScreen} from '../../../globals/utils';
import {Position, RenderMetadata, TimeLineState} from '../../../state/types';
import {AppContext} from '../../../containers/App';
import {Tool} from '../../../state/editingTools/types';
import Grid from './Grid';
import {usePlotSizing} from '../../../hooks/usePlotSizing';
import {useMouseEvent} from '../../../hooks/useMouseEvent';
import {useKeyboardEvent} from '../../../hooks/useKeyboardEvent';

interface Props {
  className?: string;
  width: number;
  height: number;
  timeline: TimeLineState;
  audioPlayhead?: number;
  clipPlayhead?: number;
  clipId?: string;
}

/**
 * Renders the base canvas with the grid and the markers
 */
function PlotArea(props: Props): JSX.Element | null {
  const dispatch = useDispatch();
  const {selectors, actions} = React.useContext(AppContext);
  const markers = selectors.project.getMarkers();
  const activeTool = selectors.editingTools.getActiveTool();
  const selectedMarkerId = selectors.editingTools.getSelectedMarkerId();

  const mousePosition = React.useRef<Position | undefined>();
  const [isDraggingMarker, setIsDraggingMarker] =
    React.useState<boolean>(false);
  const [currentMarkerTime, setCurrentMarkerTime] = React.useState<
    number | undefined
  >(undefined);
  const {containerMeasureRef, isInsideContainer, relativeMousePosition} =
    usePlotSizing(selectors);

  // Use a ref to ensure the onDoubleClick callback always has access to the
  // current clipId value, avoiding stale closure issues with React.memo
  const clipIdRef = React.useRef(props.clipId);
  React.useEffect(() => {
    clipIdRef.current = props.clipId;
  }, [props.clipId]);

  const {className, width, height, timeline} = props;

  const duration = timeline.endTime - timeline.startTime;
  const renderMetadata: RenderMetadata = {
    width: width - Constants.plot.margin.horizontal(),
    height: height - Constants.plot.margin.vertical(),
    margin: Constants.plot.margin,
    startTime: timeline.startTime,
    duration,
  };

  const diamondWidth =
    Constants.plot.grid.markersArea.diamondSize * Math.sqrt(2);

  useEffect(() => {
    const activeMarker = markers.find(marker => marker.id === selectedMarkerId);
    if (activeMarker) {
      setCurrentMarkerTime(activeMarker.time);
    } else {
      setCurrentMarkerTime(undefined);
    }
  }, [selectedMarkerId, markers, activeTool]);

  const onMouseMove = React.useCallback(
    (e: MouseEvent) => {
      const pos = relativeMousePosition(e);
      if (activeTool === Tool.Markers || isDraggingMarker) {
        const time = screenToTime({x: pos.x, y: pos.y}, renderMetadata);
        setCurrentMarkerTime(time.x);
      }
      if (
        selectedMarkerId &&
        pos.y < 0 &&
        pos.y > -Constants.plot.grid.markersArea.height &&
        e.buttons > 0 &&
        mousePosition.current &&
        // Only trigger if the mouse has moved more than 1px to avoid spurious moves during selection
        Math.abs(mousePosition.current.x - e.clientX) > 1
      ) {
        setIsDraggingMarker(true);
      }
      mousePosition.current = {x: e.clientX, y: e.clientY};
    },
    [activeTool, renderMetadata, selectedMarkerId],
  );
  useMouseEvent('mousemove', onMouseMove);

  const onMouseDown = React.useCallback(
    (e: MouseEvent) => {
      if (isInsideContainer(e)) {
        if (activeTool === Tool.Markers) {
          e.stopPropagation();
          e.preventDefault();
          dispatch(
            actions.project.createMarker({
              name: `Marker ${markers.length + 1}`,
              time: currentMarkerTime ?? 0,
            }),
          );
          // @oss-disable
          // @oss-disable
            // @oss-disable
          // @oss-disable
        } else {
          const pos = relativeMousePosition(e);
          const marker = markers.find(marker => {
            const screenPos = timeToScreen(
              {x: marker.time, y: 0},
              renderMetadata,
            ).x;
            return (
              screenPos - diamondWidth / 2 < pos.x &&
              screenPos + diamondWidth / 2 > pos.x &&
              pos.y < 0 &&
              pos.y > -Constants.plot.grid.markersArea.height
            );
          });
          if (marker) {
            e.stopImmediatePropagation();
          }
          const newSelection = marker?.id;
          if (newSelection !== selectedMarkerId) {
            dispatch(actions.editingTools.selectMarker({markerId: marker?.id}));
          }
        }
        mousePosition.current = {x: e.clientX, y: e.clientY};
      }
    },
    [
      activeTool,
      currentMarkerTime,
      isInsideContainer,
      relativeMousePosition,
      renderMetadata,
      selectedMarkerId,
    ],
  );
  useMouseEvent('mousedown', onMouseDown);

  const onMouseUp = React.useCallback(() => {
    if (isDraggingMarker && selectedMarkerId) {
      dispatch(
        actions.project.updateMarker({
          markerId: selectedMarkerId,
          time: currentMarkerTime,
        }),
      );
    }
    setIsDraggingMarker(false);
    mousePosition.current = undefined;
  }, [isDraggingMarker, selectedMarkerId, currentMarkerTime]);
  useMouseEvent('mouseup', onMouseUp);

  const onKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (activeTool === Tool.Markers) {
        if (e.key === 'Escape') {
          dispatch(actions.editingTools.enableSelect());
          setCurrentMarkerTime(undefined);
        }
      }
    },
    [activeTool],
  );
  useKeyboardEvent('keydown', onKeyDown);

  const onDoubleClick = React.useCallback(
    (e: MouseEvent) => {
      const clipId = clipIdRef.current;
      if (isInsideContainer(e) && clipId) {
        const pos = relativeMousePosition(e);
        if (pos.y < 0 && pos.y > -Constants.plot.grid.markersArea.height) {
          const time = screenToTime({x: pos.x, y: pos.y}, renderMetadata);
          dispatch(actions.project.setPlayhead({clipId, time: time.x}));
        }
      }
    },
    [isInsideContainer, relativeMousePosition, renderMetadata],
  );
  useMouseEvent('dblclick', onDoubleClick);

  if (width === 0) {
    return null;
  }

  const currentMarkerX = currentMarkerTime
    ? timeToScreen({x: currentMarkerTime, y: 0}, renderMetadata).x
    : 0;
  const audioPlayheadX = props.audioPlayhead
    ? timeToScreen({x: props.audioPlayhead, y: 0}, renderMetadata).x
    : 0;
  const clipPlayheadX = props.clipPlayhead
    ? timeToScreen({x: props.clipPlayhead, y: 0}, renderMetadata).x
    : 0;

  return (
    <div className={className} ref={containerMeasureRef}>
      <Stage width={width} height={height}>
        <Grid
          width={width}
          height={height}
          timeline={timeline}
          activeTool={activeTool}
        />

        <Layer
          x={Constants.plot.margin.left}
          y={Constants.plot.margin.top}
          name="playhead">
          {props.audioPlayhead !== undefined ? (
            <Line
              x={audioPlayheadX}
              y={0}
              points={[0, 0, 0, renderMetadata.height]}
              stroke="#fff"
              strokeWidth={2}
            />
          ) : null}
          {props.clipPlayhead !== undefined && props.clipPlayhead !== 0 ? (
            <Line
              x={clipPlayheadX}
              y={0}
              points={[0, 0, 0, renderMetadata.height]}
              stroke="#3B82F6"
              strokeWidth={2}
            />
          ) : null}
        </Layer>

        <Layer
          x={Constants.plot.margin.left}
          y={Constants.plot.margin.top - Constants.plot.grid.markersArea.height}
          name="markers"
          clipFunc={(ctx: Konva.Context) => {
            // Clip the time ticks that can overflow in the gutters
            ctx.beginPath();
            ctx.rect(0, 0, renderMetadata.width, height);
            ctx.closePath();
          }}>
          <Group name="markers">
            {markers.map((marker, index) => {
              const {x} = timeToScreen({x: marker.time, y: 0}, renderMetadata);
              return (
                <Rect
                  key={`marker-${index}`}
                  x={x}
                  y={2}
                  opacity={selectedMarkerId === marker.id ? 0.3 : 1}
                  width={Constants.plot.grid.markersArea.diamondSize}
                  height={Constants.plot.grid.markersArea.diamondSize}
                  fill="transparent"
                  stroke={theme.colors.text.secondary}
                  rotation={45}
                  strokeWidth={1}
                />
              );
            })}
          </Group>
          {currentMarkerTime ? (
            <Group name="active-marker">
              <Rect
                x={currentMarkerX}
                y={2}
                width={Constants.plot.grid.markersArea.diamondSize}
                height={Constants.plot.grid.markersArea.diamondSize}
                fill={`${theme.colors.plot.markerActive}7D`}
                stroke={theme.colors.plot.markerActive}
                rotation={45}
                strokeWidth={1}
              />
              <Line
                points={[
                  currentMarkerX,
                  Constants.plot.grid.markersArea.height - 2,
                  currentMarkerX,
                  Constants.plot.grid.markersArea.height +
                    renderMetadata.height,
                ]}
                stroke={theme.colors.plot.markerActive}
                strokeWidth={1}
              />
            </Group>
          ) : null}
        </Layer>
      </Stage>
    </div>
  );
}

PlotArea.defaultProps = {
  className: '',
  audioPlayhead: undefined,
  clipPlayhead: undefined,
  clipId: undefined,
};

export default React.memo(PlotArea);
