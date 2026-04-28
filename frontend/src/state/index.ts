/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import actionCreators from './actions';
import selectors from './selectors';
import {createStore} from './store';

const state = {store: createStore(), selectors, actionCreators};
export type State = typeof state;

export default {...state};
