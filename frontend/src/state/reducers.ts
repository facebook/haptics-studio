/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import appSlice from './app/slice';
import frameSlice from './frame/slice';
import projectSlice from './project/slice';
import editingToolsSlice from './editingTools/slice';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default () => ({
  app: appSlice.reducer,
  project: projectSlice.reducer,
  frame: frameSlice.reducer,
  editingTools: editingToolsSlice.reducer,
});
