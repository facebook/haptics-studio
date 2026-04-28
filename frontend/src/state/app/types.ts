/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  UIState,
  PanelState,
  DeviceState,
  ContentState,
  uiInitialState,
  panelInitialState,
  deviceInitialState,
  contentInitialState,
} from './reducers';

// Re-export the ExportState type for backwards compatibility
export type {ExportState} from './reducers';

/**
 * Combined AppState composed from modular sub-states.
 * This maintains backward compatibility while enabling better organization.
 */
export interface AppState
  extends UIState,
    PanelState,
    DeviceState,
    ContentState {}

/**
 * Initial state for the app slice, composed from modular sub-states.
 */
export const initialState: AppState = {
  ...uiInitialState,
  ...panelInitialState,
  ...deviceInitialState,
  ...contentInitialState,
};
