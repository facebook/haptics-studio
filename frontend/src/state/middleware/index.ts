/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createListenerMiddleware} from '@reduxjs/toolkit';

import {registerAppListeners} from './appListeners';
import {registerProjectListeners} from './projectListeners';
import {registerEditingToolsListeners} from './editingToolsListeners';

const listenerMiddleware = createListenerMiddleware();

registerAppListeners(listenerMiddleware);
registerProjectListeners(listenerMiddleware);
registerEditingToolsListeners(listenerMiddleware);

export default listenerMiddleware;
