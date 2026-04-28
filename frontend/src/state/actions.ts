/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import frameSlice from './frame/slice';
import appSlice from './app/slice';
import projectSlice from './project/slice';
import editingToolsSlice from './editingTools/slice';

export default {
  app: appSlice.actions,
  frame: frameSlice.actions,
  project: projectSlice.actions,
  editingTools: editingToolsSlice.actions,
};
