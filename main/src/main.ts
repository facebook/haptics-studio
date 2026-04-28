/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import dotenv from 'dotenv';
import path from 'path';
import {app, protocol} from 'electron';

import MainApplication from './application';
import Logger from './common/logger';
import Configs from './common/configs';
import {executeMigrations} from './common/utils';
import Analytics, {ErrorType} from './analytics';
import {build} from '../../package.json';
import {PathManager} from './services';

dotenv.config();

void (async () => {
  try {
    protocol.registerSchemesAsPrivileged([
      {
        scheme: 'media',
        privileges: {
          stream: true,
          secure: true,
          supportFetchAPI: true,
          corsEnabled: true,
          bypassCSP: true,
        },
      },
    ]);

    // Override userData path before configs are loaded
    // The data path is the appData joined with the product name (Haptics Studio)
    // This MUST happen before Configs.instance.load() so that PathManager caches the correct path
    const {productName} = build;
    let userDataPath = path.join(app.getPath('appData'), productName);
    // Set up different userData paths for each environment
    // to avoid conflicts between multiple instances of the application
    if (process.env.NODE_ENV !== 'production') {
      userDataPath += `-${process.env.NODE_ENV}`;
    }
    PathManager.instance.setPath('userData', userDataPath);

    // Load configs
    Configs.instance.load();

    // Init logger
    await Logger.instance.init();

    // Run migrations
    executeMigrations();

    // Start window manager
    await MainApplication.instance.start();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Something went wrong', error);
    Analytics.instance.addErrorEvent({
      type: ErrorType.backend,
      error_name: (error as Error).name,
      message: (error as Error).message,
      stack_trace: (error as Error).stack ?? '',
    });
  }
})();
