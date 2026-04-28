/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {ClipMarker, EnvelopeType} from '../types';

export const enum Tool {
  Cursor = 'cursor',
  Pen = 'pen',
  Emphasis = 'emphasis',
  Trim = 'trim',
  Markers = 'markers',
}

interface PenData {
  clipId: string;
  envelope: EnvelopeType;
}

interface TrimData {
  time: number | undefined;
  duration: number | undefined;
}

export interface EditingToolsState {
  active: Tool;
  penData: PenData | undefined;
  trimData: TrimData | undefined;
  selectedMarkerId: string | undefined;
  editingMarker: ClipMarker | undefined;
}

export const initialState: EditingToolsState = {
  active: Tool.Cursor,
  penData: undefined,
  trimData: undefined,
  selectedMarkerId: undefined,
  editingMarker: undefined,
};
