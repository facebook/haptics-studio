/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {ReactElement} from 'react';
import {Provider} from 'react-redux';
import {JssProvider} from 'react-jss';
import Polyglot from 'node-polyglot';
import _ from 'lodash';
import preset from 'jss-preset-default';
import {create as createJss} from 'jss';
import {
  render as rtlRender,
  RenderOptions,
  RenderResult,
} from '@testing-library/react';
import {createStore} from './state/store';
import state, {State} from './state';
import theme from './styles/theme.style';
import App, {
  AppContext,
  GlobalStyleComponent,
  AppContextType,
} from './containers/App';

const jss = createJss();
jss.setup(preset());

type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

interface Options extends RenderOptions {
  wrapper?: any;
  initialState?: any;
  selectors?: RecursivePartial<State['selectors']>;
  actions?: Partial<State['actionCreators']>;
}
/**
 * Custom test renderer that mounts the test subject inside the app providers (e.g. context, redux, theming, etc...)
 */
function render(
  ui: ReactElement,
  {initialState, actions, selectors, ...renderOptions}: Options,
): RenderResult {
  const newState = {
    ...state,
    store: createStore(initialState),
    actions,
    selectors: _.merge(state.selectors, selectors),
  };

  class Wrapper extends App {
    static getAppContext(): AppContextType {
      const {actionCreators, selectors} = newState;

      const polyglot = new Polyglot({
        phrases: require('./i18n/en.i18n.json'),
        locale: 'en',
      });

      return {
        lang: (
          phrase: string,
          options?: number | Polyglot.InterpolationOptions,
        ) => polyglot.t(phrase, options),
        actions: actionCreators,
        selectors,
      };
    }

    public render(): JSX.Element {
      return (
        <Provider store={newState.store}>
          <JssProvider jss={jss}>
            <theme.ThemeProvider theme={theme.theme}>
              <GlobalStyleComponent />
              <AppContext.Provider value={Wrapper.getAppContext()}>
                {React.cloneElement(this.props.children as ReactElement)}
              </AppContext.Provider>
            </theme.ThemeProvider>
          </JssProvider>
        </Provider>
      );
    }
  }

  return rtlRender(ui, {wrapper: Wrapper, ...renderOptions});
}

export * from '@testing-library/react';

export {render};
