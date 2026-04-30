/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';

import {BrowserWindow, BrowserWindowConstructorOptions, shell} from 'electron';

import {getAppVersion} from '../common/utils';
import PathManager from './PathManager';

interface SecondaryWindowConfig {
  url: string;
  title: string;
  width: number;
  height: number;
  parent?: BrowserWindow;
  center?: {x: number; y: number};
  onWillNavigate?: (url: string) => void;
  onDomReady?: (window: BrowserWindow) => void;
  onReadyToShow?: () => void;
  onClosed?: () => void;
}

export interface SecondaryWindowManagerCallbacks {
  getMainWindow: () => BrowserWindow | undefined;
  getMainWindowCenter: () => {x: number; y: number};
  getDefaultControls: () => boolean;
  setDefaultControls: (value: boolean) => void;
  reloadMenuItems: () => void;
}

/**
 * Manages secondary (non-main) windows such as About and Licenses.
 */
export default class SecondaryWindowManager {
  private aboutWindow: BrowserWindow | undefined;
  private licensesWindow: BrowserWindow | undefined;
  private callbacks: SecondaryWindowManagerCallbacks;

  constructor(callbacks: SecondaryWindowManagerCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Creates a secondary window with shared configuration and event handling.
   */
  private createSecondaryWindow = (
    config: SecondaryWindowConfig,
  ): BrowserWindow => {
    const options: BrowserWindowConstructorOptions = {
      width: config.width,
      height: config.height,
      useContentSize: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
      ...(config.parent && {parent: config.parent}),
      ...(config.center && {
        x: config.center.x - config.width / 2,
        y: config.center.y - config.height / 2,
      }),
    };

    const window = new BrowserWindow(options);

    void window.loadURL(config.url);
    window.setMenu(null);
    window.setTitle(config.title);
    window.setBackgroundColor('#18191a');

    window.webContents.on('will-navigate', (e, url) => {
      e.preventDefault();
      if (config.onWillNavigate) {
        config.onWillNavigate(url);
      } else {
        void shell.openExternal(url);
      }
    });

    window.webContents.setWindowOpenHandler(details => {
      void shell.openExternal(details.url);
      return {action: 'deny'};
    });

    if (config.onDomReady) {
      window.webContents.once('dom-ready', () => {
        config.onDomReady!(window);
      });
    }

    window.once('ready-to-show', () => {
      config.onReadyToShow?.();
      window.show();
    });

    window.once('closed', () => {
      config.onClosed?.();
    });

    return window;
  };

  /**
   * Shows the about window, creating one if needed.
   */
  public showAboutWindow = () => {
    const previousDefaultControls = this.callbacks.getDefaultControls();

    if (this.aboutWindow) {
      this.aboutWindow.show();
      return;
    }

    const url = `file://${path.join(PathManager.instance.getAssetsPath(), 'about.html')}`;

    this.aboutWindow = this.createSecondaryWindow({
      url,
      title: 'About Haptics Studio',
      width: 400,
      height: 500,
      parent: this.callbacks.getMainWindow(),
      center: this.callbacks.getMainWindowCenter(),
      onWillNavigate: (navUrl: string) => {
        if (navUrl.startsWith('http://licenses')) {
          this.showLicensesWindow();
          return;
        }
        void shell.openExternal(navUrl);
      },
      onDomReady: (aboutWindow: BrowserWindow) => {
        void aboutWindow.webContents.executeJavaScript(
          `document.getElementById('version').innerText = "Version ${getAppVersion()}"`,
          true,
        );
        void aboutWindow.webContents.executeJavaScript(
          `document.getElementById('env').innerText = "${process.env.NODE_ENV === 'production' ? '' : `(${process.env.NODE_ENV})`}"`,
          true,
        );
      },
      onReadyToShow: () => {
        this.callbacks.setDefaultControls(true);
        this.callbacks.reloadMenuItems();
      },
      onClosed: () => {
        this.callbacks.setDefaultControls(previousDefaultControls);
        this.aboutWindow = undefined;
      },
    });
  };

  /**
   * Shows the licenses window, creating one if needed.
   */
  public showLicensesWindow = () => {
    if (this.licensesWindow) {
      this.licensesWindow.show();
      return;
    }

    const url = `file://${path.join(PathManager.instance.getAssetsPath(), 'licenses.html')}`;

    this.licensesWindow = this.createSecondaryWindow({
      url,
      title: 'Acknowledgements',
      width: 800,
      height: 600,
      onClosed: () => {
        this.licensesWindow = undefined;
      },
    });
  };
}
