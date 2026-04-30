/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';
import {v4 as uuidv4} from 'uuid';

import {app, BrowserWindow, Menu, nativeImage, shell} from 'electron';
import windowStateKeeper from 'electron-window-state';
import {ClipboardWatcher} from 'electron-clipboard-watcher';
import {HapticsSdkNapi} from './hapticsSdk';
import {execSync} from 'child_process';
import {
  installExtension,
  REDUX_DEVTOOLS,
  REACT_DEVELOPER_TOOLS,
} from 'electron-devtools-installer';

import {name, build} from '../../package.json';
import Logger from './common/logger';
import Project from './common/project';
import listenToEvents, {IPCMessage} from './listeners';
import {
  saveProject,
  cloneProject,
  closeProject,
  newProject,
  loadProject,
} from './actions/project';
import {openProject} from './actions/files';
import Configs from './common/configs';
import Constants from './common/constants';
import {
  developerMessagesEnabled,
  escapeFilePath,
  getAdbPath,
  getAppVersion,
  getProjectToOpen,
  isOnWindows,
} from './common/utils';
import ADBDevice from './device';
import WSServer from './wsServer';
import Updater from './updater';
import Analytics from './analytics'; // @oss-enable
// @oss-disable
import CrashReporter from './crashReporter';
import {CustomFlags, getCustomFlags} from './customFlags';
import {MenuBuilder, MenuToggleState, MenuBuilderConfig} from './menu';
import {
  PathManager,
  ClipboardService,
  SecondaryWindowManager,
  ProtocolHandler,
  FileAssociationHandler,
} from './services';

const env = process.env.NODE_ENV || 'development';
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

const singletonEnforcer = Symbol('singletonEnforcer');

let remoteMain: typeof import('@electron/remote/main');

/**
 * Singleton class that handles Window workflow
 * */
export default class MainApplication {
  private menuBuilder: MenuBuilder | undefined;

  private mainWindow: BrowserWindow | undefined;

  private secondaryWindowManager: SecondaryWindowManager | undefined;

  private adbDeviceMounted = false;

  public clipboardWatcher: ClipboardWatcher | undefined;

  public defaultControls = false;

  public static HapticsSdkNapi: HapticsSdkNapi = require('HapticsSdkNapi');

  private devicePanelOpen = false;

  private customFlags: CustomFlags = {};

  private clipboardService: ClipboardService;

  private fileAssociationHandler: FileAssociationHandler;

  private windowLoaded = false;

  private uiMessages: {action: string; message: any}[] = [];

  private static singleton: MainApplication;

  /**
   * Represents an Application window instance
   * @constructor
   * */
  constructor(enforcer: symbol) {
    if (enforcer !== singletonEnforcer)
      throw new Error('Cannot construct singleton');

    // Create file association handler
    this.fileAssociationHandler = new FileAssociationHandler({
      sendToUI: this.sendToUI,
    });
    this.fileAssociationHandler.registerEarlyOpenFile();

    // Create clipboard service instance
    this.clipboardService = new ClipboardService({
      onTextChange: (pasteEnabled: boolean) => {
        // eslint-disable-next-line camelcase
        this.toggleMenuItems({
          paste: pasteEnabled,
          paste_in_place: pasteEnabled,
        });
      },
      sendToUI: this.sendToUI,
    });

    // Create secondary window manager
    this.secondaryWindowManager = new SecondaryWindowManager({
      getMainWindow: () => this.mainWindow,
      getMainWindowCenter: this.getMainWindowCenter,
      getDefaultControls: () => this.defaultControls,
      setDefaultControls: (value: boolean) => {
        this.defaultControls = value;
      },
      reloadMenuItems: () => this.reloadMenuItems(),
    });
  }

  /**
   * Returns the current application instance
   * @return { MainApplication } - Current application instance
   * */
  static get instance(): MainApplication {
    if (!MainApplication.singleton) {
      MainApplication.singleton = new MainApplication(singletonEnforcer);
    }
    return MainApplication.singleton;
  }

  /**
   * @return { string } - Application name
   * */
  public getName = (): string => {
    return name;
  };

  public getDevicePanelOpen = (): boolean => {
    return this.devicePanelOpen;
  };

  public setDevicePanelOpen = (devicePanelOpen: boolean): void => {
    this.devicePanelOpen = devicePanelOpen;
  };

  /**
   * Creates the main window and binds IPC events listeners
   * */
  public start = async (): Promise<void> => {
    app.on('activate', () => {
      // Create a new window when the icon in the dock is clicked on macOS
      if (BrowserWindow.getAllWindows().length === 0) {
        void this.initWindow();
      }
    });

    // Register file association handlers (open-file, single-instance, second-instance)
    const shouldContinue =
      this.fileAssociationHandler.registerAppReadyHandlers();
    if (!shouldContinue) {
      return;
    }

    app.on('before-quit', e => {
      e.preventDefault();
      this.clipboardService.stopWatching();
      // @oss-disable
      Promise.all([
        ADBDevice.instance.stopDevicePolling(),
        Analytics.instance.stop(),
      ])
        // eslint-disable-next-line no-console
        .catch(console.error)
        .finally(() => app.exit());
    });

    // Setup Crash reporter
    const crashReporter = new CrashReporter();

    this.customFlags = getCustomFlags(PathManager.instance.getDataPath());

    await app.whenReady();

    ProtocolHandler.register();

    // Import here, rather than at the beginning of the file, because a bug in @electron/remote
    // causes the Jest tests to fail when the module is imported. This start() function is not
    // called from the tests, and therefore importing the module here is ok.
    // See https://github.com/electron/remote/issues/100.
    remoteMain = await import('@electron/remote/main');
    remoteMain.initialize();

    await this.initWindow();

    this.initListeners();

    // Automatic check for updates
    Updater.checkForUpdates();

    // Start WebSocket Server
    WSServer.instance.start();

    // Ensure that the user id is set before we start the analytics module
    if (!Configs.configs.userId) {
      Configs.instance.set('userId', uuidv4());
    }
    // Start Telemetry
    Analytics.instance.start();

    // Send crash reports
    crashReporter.sendCrashReports();

    // @oss-disable
  };

  public reloadMenuItems = (): void => {
    this.initMenu();
    this.sendToUI('window_info', this.getWindowInfo());
  };

  public getMainWindow = (): BrowserWindow | undefined => {
    return this.mainWindow;
  };

  public getApplicationMenu = (): Menu | undefined => {
    return this.menuBuilder?.getMenu();
  };

  public getMainUrl = (): string => {
    if (env === 'development') {
      return 'http://localhost:8080';
    }
    const publicPath = PathManager.instance.getPublicPath() || '';
    return `file://${publicPath}/index.html`;
  };

  public loadMainUrl = (): void => {
    if (this.mainWindow) {
      void this.mainWindow.loadURL(this.getMainUrl());
    }
  };

  public get selectedProjectFile(): string | undefined {
    return this.fileAssociationHandler.selectedProjectFile;
  }

  public set selectedProjectFile(value: string | undefined) {
    this.fileAssociationHandler.selectedProjectFile = value;
  }

  /**
   * Initializes the main window events and load the main web content
   * */
  private initWindow = async (): Promise<void> => {
    if (env === 'development') {
      try {
        await installExtension([REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS]);
      } catch (error) {
        Logger.error(
          'An error occurred while installing the devtools: ',
          error,
        );
      }
    }

    const iconPath = path.join(
      __dirname,
      '..',
      'assets',
      'icons',
      'AppIcon.icns',
    );
    const image = nativeImage.createFromPath(iconPath);

    // Load the previous state with fallback to defaults
    const mainWindowState = windowStateKeeper({
      path: Configs.configs.app.configPath,
      defaultWidth: Constants.MIN_WINDOW_SIZE.WIDTH,
      defaultHeight: Constants.MIN_WINDOW_SIZE.HEIGHT,
    });

    this.mainWindow = new BrowserWindow({
      show: false,
      backgroundColor: '#18191a',
      x: mainWindowState.x,
      y: mainWindowState.y,
      minWidth: Constants.MIN_WINDOW_SIZE.WIDTH,
      minHeight: Constants.MIN_WINDOW_SIZE.HEIGHT,
      title: build.productName,
      width: mainWindowState.width,
      height: mainWindowState.height,
      frame: true,
      center: true,
      resizable: true,
      fullscreen: false,
      fullscreenable: true,
      maximizable: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
      icon: image,
      titleBarStyle: isOnWindows() ? 'default' : 'hidden',
      trafficLightPosition: isOnWindows() ? undefined : {x: 16, y: 18},
      titleBarOverlay: {
        // color of title bar
        color: '#18191A',
        // color of title bar control
        symbolColor: '#FFFFFF99',
        // height of title bar
        height: 50,
      },
    });

    remoteMain.enable(this.mainWindow.webContents);

    // Let us register listeners on the window, so we can update the state
    // automatically (the listeners will be removed when the window is closed)
    // and restore the maximized or full screen state
    mainWindowState.manage(this.mainWindow);

    void this.mainWindow.loadURL(this.getMainUrl());

    this.mainWindow.webContents.on('did-finish-load', () => {
      if (!this.mainWindow) {
        throw new Error('Main Window is not defined');
      }
      this.windowLoaded = true;

      if (process.env.NODE_ENV === 'test') {
        // Make sure that E2E test are performed at the same resolution
        this.mainWindow.webContents.enableDeviceEmulation({
          screenPosition: 'desktop',
          screenSize: {
            width: Constants.MIN_WINDOW_SIZE.WIDTH,
            height: Constants.MIN_WINDOW_SIZE.HEIGHT,
          },
          deviceScaleFactor: 2,
          viewPosition: {x: 0, y: 0},
          viewSize: {
            width: Constants.MIN_WINDOW_SIZE.WIDTH,
            height: Constants.MIN_WINDOW_SIZE.HEIGHT,
          },
          scale: 1,
        });
      }

      if (process.env.START_MINIMIZED) {
        this.mainWindow.minimize();
      } else {
        this.mainWindow.show();
        this.mainWindow.focus();
      }

      // Send terms and conditions
      this.sendToUI('terms_and_conditions', {
        termsAccepted: Configs.configs.termsAccepted,
      });

      // Send enqueued messages
      // eslint-disable-next-line no-restricted-syntax
      for (const uiMessage of this.uiMessages) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const {action, message} = uiMessage;
        this.sendToUI(action, message);
      }
      this.uiMessages = [];
      this.sendToUI('window_info', this.getWindowInfo());
    });

    this.mainWindow.webContents.on('will-navigate', (e, url) => {
      if (url.startsWith('http') && !url.startsWith('http://localhost:8080')) {
        e.preventDefault();
        void shell.openExternal(url);
      }

      if (url.startsWith('documentation:')) {
        e.preventDefault();
        const action = `documentation_${url.replace('documentation:', '')}`;
        const message: IPCMessage = {action, status: 'ok', payload: {}};
        this.sendToUI(action, message);
      }
    });

    this.mainWindow.on('closed', () => {
      if (this.mainWindow) {
        this.mainWindow.destroy();
      }
    });

    this.mainWindow.on('resize', () => {
      this.sendToUI('window_info', this.getWindowInfo());
    });

    if (process.platform === 'darwin') {
      app.dock?.setIcon(image);
      app.dock?.bounce();
    }
    this.initMenu();
    this.watchClipboard();

    ADBDevice.instance.startDevicePolling();

    this.mainWindow.webContents.session.on(
      'select-hid-device',
      (event, details, callback) => {
        event.preventDefault();
        if (details.deviceList && details.deviceList.length > 0) {
          callback(details.deviceList[0].deviceId);
        }
      },
    );

    this.mainWindow.webContents.session.on(
      'hid-device-added',
      (event, device) => {
        Logger.debug(`HID added ${JSON.stringify(device)}`);
      },
    );

    this.mainWindow.webContents.session.on(
      'hid-device-removed',
      (event, device) => {
        Logger.debug(`HID removed ${JSON.stringify(device)}`);
      },
    );

    this.mainWindow.webContents.session.setPermissionRequestHandler(
      (webContents, permission, callback) => {
        callback(true);
      },
    );

    this.mainWindow.webContents.session.setPermissionCheckHandler(() => {
      return true;
    });

    this.mainWindow.webContents.session.setDevicePermissionHandler(() => {
      return true;
    });
  };

  private getWindowInfo() {
    const windowInfo = {
      size: this.mainWindow?.getSize(),
      fullScreen: this.mainWindow?.fullScreen,
      title: this.mainWindow?.title,
      isOnWindows: isOnWindows(),
      projectName: Project.instance.getName() || Constants.DEFAULT_PROJECT_NAME,
      // The dirty status will be hidden for the tutorial
      isCurrentProjectDirty: Project.instance.isTutorial()
        ? false
        : Configs.instance.isCurrentProjectDirty(),
      version: getAppVersion(),
      flags: this.customFlags,
    };
    Logger.silly('getWindowInfo', windowInfo);
    return windowInfo;
  }

  /**
   * Watch clipboard content to enable/disable paste feature
   */
  private watchClipboard = (): void => {
    this.clipboardService.startWatching(() =>
      Configs.instance.hasCurrentProject(),
    );
    this.clipboardWatcher = this.clipboardService.getWatcher();
  };

  public sendToUI = (action: string, message: any = {}): void => {
    if (!this.mainWindow || this.mainWindow?.isDestroyed()) return;

    const act = (message as IPCMessage).status === 'error' ? 'error' : action;

    if (this.windowLoaded) {
      this.mainWindow.webContents.send(act, message);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      this.uiMessages.push({action: act, message});
    }
  };

  public sendDeveloperMessage = (action: string, message: any = {}): void => {
    if (developerMessagesEnabled()) {
      this.sendToUI(action, message);
    }
  };

  public remountAdbDevice = (): void => {
    try {
      Logger.debug('Mounting ADB device');
      const adbPath = escapeFilePath(getAdbPath());
      execSync(`${adbPath} root`);
      execSync(`${adbPath} remount`);
      this.adbDeviceMounted = true;
    } catch (error) {
      this.adbDeviceMounted = false;
      Logger.error((error as Error).message);
    }
  };

  public isAdbDeviceMounted = (): boolean => {
    return this.adbDeviceMounted;
  };

  /**
   * Creates the MenuBuilder configuration with all callbacks
   */
  private createMenuBuilderConfig = (): MenuBuilderConfig => {
    return {
      productName: build.productName,
      callbacks: {
        sendToUI: this.sendToUI,
        showAboutWindow: this.secondaryWindowManager!.showAboutWindow,
        isClipboardValid: this.clipboardService.isValid,
        clipboardContainsEmphasis: this.clipboardService.containsEmphasis,
        sendClipboardContent: this.sendClipboardContent,
        onNewProject: async () => {
          const action = 'new';
          const message = await newProject(action);
          if (message.status !== 'canceled') {
            this.sendToUI('open', message);
          }
        },
        onOpenProject: async () => {
          await openProject();
        },
        onCloseProject: async () => {
          const action = 'close';
          const response = await closeProject(action);
          if (response.status === 'canceled') {
            return;
          }
          this.sendToUI(action, {});
        },
        onSaveProject: async () => {
          const action = 'save';
          const message = await saveProject(action);
          this.sendToUI(action, message);
        },
        onSaveAsProject: async () => {
          const action = 'save_as';
          const message = await cloneProject(action);
          this.sendToUI(action, message);
        },
        onLoadProject: async (projectFile: string, isDirty: boolean) => {
          const action = 'open';
          const message = await loadProject(action, projectFile, isDirty);
          this.sendToUI(action, message);
        },
        onCheckForUpdates: () => Updater.instance.checkForUpdates(false),
        openExternal: (url: string) => shell.openExternal(url),
        getAppVersion: () => getAppVersion(),
        getReleaseNotesPath: () => path.join(process.cwd(), 'release-notes.md'),
      },
      dataProviders: {
        getRecentProjects: () =>
          Configs.configs.recentProjects.filter(project =>
            Project.projectExists(project),
          ),
        getSamplesProjects: () => Configs.getSamplesProjects(),
        getProjectToOpen: (filePath: string) => getProjectToOpen(filePath),
        getHelpMenuItems: () => Constants.MENU.HELP,
      },
    };
  };

  /**
   * Creates the application menu
   */
  private initMenu = (): void => {
    // Create MenuBuilder if it doesn't exist
    if (!this.menuBuilder) {
      this.menuBuilder = new MenuBuilder(this.createMenuBuilderConfig());
    }

    // Build menu with current options
    this.menuBuilder.build({
      termsAccepted: Configs.configs.termsAccepted,
      hasCurrentProject: Configs.instance.hasCurrentProject(),
      isCurrentProjectDirty: Configs.instance.isCurrentProjectDirty(),
      isTutorial: Project.instance.isTutorial(),
      isAuthoringTutorial: Project.instance.isAuthoringTutorial(),
      projectName: Project.instance.getName() || Constants.DEFAULT_PROJECT_NAME,
      isOnWindows: isOnWindows(),
      isDevelopment: env === 'development',
      defaultControls: this.defaultControls,
    });
  };

  public toggleMenuItems = (items: MenuToggleState): void => {
    this.menuBuilder?.toggleMenuItems(items);
  };

  public sendClipboardContent = (action: string): void => {
    this.clipboardService.sendContent(action);
  };

  /**
   * Binds specific IPC listeners for the communication
   * between Electron and the UI
   * */
  private initListeners = (): void => {
    listenToEvents();
  };

  /**
   * Finds the center of the main window and returns the position
   * */
  public getMainWindowCenter = (): {x: number; y: number} => {
    const [x, y] = this.mainWindow?.getPosition() || [];
    const [w, h] = this.mainWindow?.getSize() || [];
    return {x: x + w / 2, y: y + h / 2};
  };
}
