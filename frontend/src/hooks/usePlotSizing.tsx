/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {State} from '../state';
import {Position, Rectangle} from '../state/types';
import Constants from '../globals/constants';

export const usePlotSizing = (
  selectors: State['selectors'],
): {
  containerMeasureRef: (node: HTMLDivElement | null) => void;
  origin: React.RefObject<Rectangle>;
  isInsideContainer: (event: MouseEvent) => boolean;
  relativeMousePosition: (event: MouseEvent) => Position;
} => {
  const leftPanelWidth = selectors.app.getSidePanelWidth('left');
  const rightPanelWidth = selectors.app.getSidePanelWidth('right');
  const origin = React.useRef<Rectangle>({x: 0, y: 0, width: 0, height: 0});
  const element = React.useRef<HTMLDivElement | null>(null);

  const setSize = React.useCallback(() => {
    if (element.current) {
      origin.current = element.current.getBoundingClientRect();
    }
  }, []);

  const containerMeasureRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      element.current = node;
      setSize();
    },
    [setSize],
  );

  React.useEffect(() => {
    setSize();
    window.addEventListener('resize', setSize);
    return () => {
      window.removeEventListener('resize', setSize);
    };
  }, [leftPanelWidth, rightPanelWidth, setSize]);

  const relativeMousePosition = (event: MouseEvent): Position => {
    return {
      x: event.clientX - origin.current.x - Constants.plot.margin.left,
      y: event.clientY - origin.current.y - Constants.plot.margin.top,
    };
  };

  const isInsideContainer = (event: MouseEvent) => {
    return (
      event.clientX > origin.current.x &&
      event.clientX < origin.current.x + origin.current.width &&
      event.clientY > origin.current.y &&
      event.clientY < origin.current.y + origin.current.height
    );
  };

  return {
    containerMeasureRef,
    origin,
    isInsideContainer,
    relativeMousePosition,
  };
};
