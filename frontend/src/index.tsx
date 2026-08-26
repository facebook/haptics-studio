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
import {IpcSendChannel} from '../../shared';
import {typedSend} from '../../shared/typed-ipc';

import state from './state';
import App from './containers/App';
import theme from './styles/theme.style';

import './styles/fonts.global.scss';

const jss = createJss();
jss.setup(preset());

// Clear custom flags from the local storage, flags will be loaded asynchronously from the backend
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('flags:')) localStorage.removeItem(key);
});

if (process.env.NODE_ENV !== 'development') {
  window.addEventListener('error', event => {
    typedSend(IpcSendChannel.RendererFatalError, {
      message: event.error?.stack ?? event.message,
    });
  });
  window.addEventListener('unhandledrejection', event => {
    const reason = event.reason;
    typedSend(IpcSendChannel.RendererFatalError, {
      message: reason instanceof Error ? reason.stack ?? reason.message : String(reason),
    });
  });
}

// Prevent opening dropped files in a separate window when they land outside a dropzone.
window.addEventListener('dragover', event => {
  event.preventDefault();
});
window.addEventListener('drop', event => {
  event.preventDefault();
});

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
