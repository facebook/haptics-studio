/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import 'regenerator-runtime/runtime';
import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {create as createJss} from 'jss';
import preset from 'jss-preset-default';
import {JssProvider} from 'react-jss';
import {app, dialog} from '@electron/remote';

import state from './state';
import App from './containers/App';
import theme from './styles/theme.style';
import Constants from '../../main/src/common/constants';

import './styles/fonts.global.scss';

const jss = createJss();
jss.setup(preset());

// Clear custom flags from the local storage, flags will be loaded asynchronously from the backend
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('flags:')) localStorage.removeItem(key);
});

if (window.process && process.env.NODE_ENV !== 'development') {
  window.process.on('uncaughtException', () => {
    if (Constants.SHOULD_RESTART_ON_EXCEPTION) {
      dialog.showMessageBoxSync({
        type: 'error',
        message: 'An internal error occurred. Restarting the application.',
        title: 'Error',
      });
      app.relaunch();
      app.quit();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(
    <Provider store={state.store}>
      <JssProvider jss={jss}>
        <theme.ThemeProvider theme={theme.theme}>
          <App state={state} />
        </theme.ThemeProvider>
      </JssProvider>
    </Provider>,
    document.getElementById('app'),
  );
});
