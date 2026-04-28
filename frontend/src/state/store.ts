/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {combineReducers} from 'redux';
import {configureStore} from '@reduxjs/toolkit';
import {ToolkitStore} from '@reduxjs/toolkit/dist/configureStore';

import createRootReducers from './reducers';
import listenerMiddleware from './middleware';

import {initialState as frameState, FrameState} from './frame/slice';
import {initialState as appState, AppState} from './app/types';
import {initialState as projectState, ProjectState} from './project/types';
import {
  initialState as editingToolsState,
  EditingToolsState,
} from './editingTools/types';

/* Redux State */

export interface RootState {
  app: AppState;
  project: ProjectState;
  frame: FrameState;
  editingTools: EditingToolsState;
}

const defaults: RootState = {
  frame: frameState,
  app: appState,
  project: projectState,
  editingTools: editingToolsState,
};

export const initialValues = {
  ...defaults,
};

const rootReducers = createRootReducers();

const storeMiddlewares = [listenerMiddleware.middleware];

// Filter out actions that are not interesting/spammy for the Redux DevTools Extension
const filteredActions = ['app/setPointDetail'];

function createStore(initialState?: RootState): ToolkitStore {
  const store = configureStore({
    reducer: combineReducers({
      ...rootReducers,
    }),
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        thunk: true,
        immutableCheck: false,
        serializableCheck: false,
      }).prepend(storeMiddlewares),
    devTools:
      process.env.NODE_ENV === 'development'
        ? {actionsDenylist: filteredActions}
        : false,
    preloadedState: initialState ?? initialValues,
  });

  if (process.env.NODE_ENV === 'development' && module.hot) {
    module.hot.accept('./reducers', () => {
      const nextReducer = require('./reducers')
        .default as typeof createRootReducers;
      store.replaceReducer(combineReducers(nextReducer()));
    });
  }

  return store;
}

export type AppDispatch = ReturnType<typeof createStore>['dispatch'];

export {defaults, createStore};
