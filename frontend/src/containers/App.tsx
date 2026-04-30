/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Polyglot from 'node-polyglot';
import React, {Component} from 'react';

import {State} from '../state';
import useGlobalStyles from '../styles/styles.style';
import ErrorBoundary from '../components/common/ErrorBoundary';
import WindowHeader from '../components/common/WindowHeader';
import MainContent from './MainContent';

function getLangData(locale: string) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return require(`../i18n/${locale}.i18n.json`);
}

export const GlobalStyleComponent = (): JSX.Element => {
  useGlobalStyles();
  return <></>;
};

export interface AppContextType {
  lang: (
    phrase: string,
    options?: number | Polyglot.InterpolationOptions,
  ) => string;
  actions: State['actionCreators'];
  selectors: State['selectors'];
}

export const AppContext = React.createContext<AppContextType>({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  lang: (phrase: string, _options?: number | Polyglot.InterpolationOptions) =>
    phrase,

  actions: {} as AppContextType['actions'],
  selectors: {} as AppContextType['selectors'],
});

export const useAppContext: () => AppContextType = () =>
  React.useContext(AppContext);

interface Props {
  state: State;
}

interface AppState {}

class App extends Component<Props, AppState> {
  public static defaultProps = {};

  private polyglot: Polyglot;
  private appContext: AppContextType;

  constructor(props: Props) {
    super(props);

    const supported = ['en'];
    const userLocale = navigator.language;

    let language = userLocale.split('-')[0] || 'en';

    if (!supported.includes(language)) {
      language = 'en';
    }

    this.polyglot = new Polyglot({
      phrases: getLangData(language),
      locale: language,
    });

    const {actionCreators, selectors} = props.state ?? ({} as Props['state']);
    this.appContext = {
      lang: (
        phrase: string,
        options?: number | Polyglot.InterpolationOptions,
      ) => this.polyglot.t(phrase, options),
      actions: actionCreators,
      selectors,
    };
  }

  public render(): JSX.Element {
    return (
      <div className="app-container">
        <GlobalStyleComponent />
        <AppContext.Provider value={this.appContext}>
          <ErrorBoundary>
            <div
              style={{
                height: '100vh',
                display: 'flex',
                width: '100%',
                flexDirection: 'column',
              }}>
              <WindowHeader />
              <MainContent />
            </div>
          </ErrorBoundary>
        </AppContext.Provider>
      </div>
    );
  }
}

export default App;
