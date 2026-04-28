/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {forEach, snakeCase} from 'lodash';
import fs from 'fs';

import {Menu, MenuItem, MenuItemConstructorOptions} from 'electron';

import {IPCMessage} from '../listeners';
import {
  MenuToggleItem,
  MenuToggleState,
  MenuBuildOptions,
  MenuBuilderConfig,
  EmphasisMenuState,
  ExportMenuState,
} from './types';

/**
 * MenuBuilder handles the construction and management of the application menu.
 */
export default class MenuBuilder {
  private menu: Menu | undefined;
  private menuItemsToggleState: MenuToggleState = {};
  private readonly config: MenuBuilderConfig;
  // Fingerprint of the last build inputs. Used to skip redundant
  // Menu.setApplicationMenu calls, which cause the macOS menu bar to flash.
  private lastBuildFingerprint: string | undefined;

  constructor(config: MenuBuilderConfig) {
    this.config = config;
  }

  /**
   * Computes a fingerprint of all inputs that influence the built menu.
   * Used to skip rebuilds when nothing has actually changed.
   */
  private computeBuildFingerprint(
    options: MenuBuildOptions,
    emphasisState: EmphasisMenuState,
    exportState: ExportMenuState,
  ): string {
    const updaterItem = this.menu?.getMenuItemById('updater');
    return JSON.stringify({
      options,
      toggle: this.menuItemsToggleState,
      emphasisState,
      exportState,
      updaterLabel: updaterItem?.label,
      updaterEnabled: updaterItem?.enabled,
      isClipboardValid: this.config.callbacks.isClipboardValid(),
      clipboardContainsEmphasis:
        this.config.callbacks.clipboardContainsEmphasis(),
      samples: this.config.dataProviders
        .getSamplesProjects()
        .map(p => `${p.name}|${p.projectFile}`),
      recents: this.config.dataProviders
        .getRecentProjects()
        .map(p => `${p.name}|${p.projectFile}`),
      help: this.config.dataProviders
        .getHelpMenuItems()
        .map(m => `${m.label}|${m.url}`),
    });
  }

  /**
   * Returns the current menu instance
   */
  public getMenu(): Menu | undefined {
    return this.menu;
  }

  /**
   * Returns menu item by ID
   */
  public getMenuItemById(id: string): MenuItem | null {
    return this.menu?.getMenuItemById(id) ?? null;
  }

  /**
   * Returns the current toggle state for a menu item
   */
  public getToggleState(item: MenuToggleItem): boolean {
    return this.menuItemsToggleState[item] ?? false;
  }

  /**
   * Builds and sets the application menu based on the current options.
   * Skips the rebuild when nothing has changed since the last call to avoid
   * the macOS menu bar flashing on every Menu.setApplicationMenu call.
   */
  public build(options: MenuBuildOptions): Menu {
    const {termsAccepted} = options;

    // Get previous menu state before computing fingerprint / rebuilding
    const emphasisState = this.getEmphasisState();
    const exportState = this.getExportState();

    // Skip rebuild + setApplicationMenu if nothing has changed.
    const fingerprint = this.computeBuildFingerprint(
      options,
      emphasisState,
      exportState,
    );
    if (this.menu && fingerprint === this.lastBuildFingerprint) {
      return this.menu;
    }
    this.lastBuildFingerprint = fingerprint;

    const aboutMenu = this.buildAboutMenu(options);

    if (!termsAccepted) {
      this.menu = Menu.buildFromTemplate(
        [aboutMenu].concat(
          options.isDevelopment
            ? [
                {
                  label: 'View',
                  submenu: [{role: 'reload'}, {role: 'toggleDevTools'}],
                },
              ]
            : [],
        ),
      );
      Menu.setApplicationMenu(this.menu);
      return this.menu;
    }

    const template: Array<MenuItemConstructorOptions | MenuItem> = [];

    const fileMenu = this.buildFileMenu(options, exportState);
    const editMenu = this.buildEditMenu(options, emphasisState);
    const windowMenu = this.buildWindowMenu();

    if (options.isOnWindows) {
      // On Windows, merge about menu items into file menu
      (fileMenu.submenu as MenuItemConstructorOptions[]).push({
        type: 'separator',
      });
      (fileMenu.submenu as MenuItemConstructorOptions[]).push(
        ...(aboutMenu.submenu as MenuItemConstructorOptions[]),
      );
      template.push(fileMenu);
    } else {
      template.push(aboutMenu);
      template.push(fileMenu);
    }

    template.push(editMenu);
    template.push(windowMenu);

    if (options.isDevelopment) {
      template.push(this.buildDevToolsMenu());
    }

    template.push(this.buildHelpMenu());

    this.menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(this.menu);
    return this.menu;
  }

  /**
   * Toggles menu items enabled state.
   *
   * Note: we intentionally do NOT call Menu.setApplicationMenu here. The menu
   * is already installed as the application menu, and MenuItem.enabled
   * mutations are reflected live. Re-calling setApplicationMenu would cause
   * the macOS menu bar to flash on every toggle (e.g. on every clipboard
   * change).
   */
  public toggleMenuItems(items: MenuToggleState): void {
    if (this.menu) {
      forEach(items, (enabled, key) => {
        this.menuItemsToggleState[key as MenuToggleItem] = enabled;
        const item = this.menu?.getMenuItemById(key);
        if (item) {
          item.enabled = enabled === true;
        }
      });
    }
  }

  /**
   * Gets the current emphasis menu state from existing menu
   */
  private getEmphasisState(): EmphasisMenuState {
    let emphasisEnabled = false;
    let emphasisChecked = false;
    if (this.menu) {
      const item = this.menu.getMenuItemById('emphasis');
      if (item) {
        emphasisEnabled = item.enabled;
        emphasisChecked = item.checked;
      }
    }
    return {enabled: emphasisEnabled, checked: emphasisChecked};
  }

  /**
   * Gets the current export menu state from existing menu
   */
  private getExportState(): ExportMenuState {
    let exportEnabled = true;
    let exportAllEnabled = true;
    if (this.menu) {
      const exportItem = this.menu.getMenuItemById('export');
      const exportAllItem = this.menu.getMenuItemById('export_all');
      if (exportItem) {
        exportEnabled = exportItem.enabled;
      }
      if (exportAllItem) {
        exportAllEnabled = exportAllItem.enabled;
      }
    }
    return {exportEnabled, exportAllEnabled};
  }

  /**
   * Builds the About menu (app menu on macOS)
   */
  private buildAboutMenu(
    options: MenuBuildOptions,
  ): MenuItemConstructorOptions {
    const {callbacks} = this.config;
    const {termsAccepted} = options;

    const updaterItem = {
      id: 'updater',
      label:
        this.menu?.getMenuItemById('updater')?.label || 'Check for Updates...',
      enabled: !(this.menu?.getMenuItemById('updater')?.enabled === false),
      click: () => callbacks.onCheckForUpdates(),
    };

    const aboutMenu: MenuItemConstructorOptions = {
      label: this.config.productName,
      submenu: [
        {
          id: 'about',
          label: `About ${this.config.productName}`,
          click: () => {
            callbacks.showAboutWindow();
          },
        },
        {
          id: 'telemetry',
          label: 'Data Preferences...',
          click: () => {
            const action = 'telemetry_consent_settings';
            const message: IPCMessage = {action, status: 'ok', payload: {}};
            callbacks.sendToUI(action, message);
          },
        },
      ],
    };

    if (termsAccepted) {
      (aboutMenu.submenu as MenuItemConstructorOptions[]).push(updaterItem);
    }
    (aboutMenu.submenu as MenuItemConstructorOptions[]).push({
      type: 'separator',
    });
    (aboutMenu.submenu as MenuItemConstructorOptions[]).push({
      role: 'quit',
      label: `Quit ${this.config.productName}`,
    });

    return aboutMenu;
  }

  /**
   * Builds the File menu
   */
  private buildFileMenu(
    options: MenuBuildOptions,
    exportState: ExportMenuState,
  ): MenuItemConstructorOptions {
    const {callbacks, dataProviders} = this.config;
    const {hasCurrentProject, isCurrentProjectDirty, isTutorial} = options;
    const {exportEnabled, exportAllEnabled} = exportState;

    return {
      id: 'file',
      label: 'File',
      submenu: [
        {
          id: 'new',
          label: 'New Project',
          enabled: true,
          accelerator: 'CommandOrControl+Shift+N',
          click: async () => {
            await callbacks.onNewProject();
          },
        },
        {
          id: 'open',
          label: 'Open Project',
          accelerator: 'CommandOrControl+O',
          click: async () => {
            await callbacks.onOpenProject();
          },
        },
        {
          id: 'samples',
          label: 'Samples Library',
          submenu: dataProviders.getSamplesProjects().map(project => ({
            label: `${project.name} - ${project.projectFile}`,
            click: async () => {
              const {projectToOpen, isDirty} = dataProviders.getProjectToOpen(
                project.projectFile ?? '',
              );
              await callbacks.onLoadProject(projectToOpen, isDirty);
            },
          })),
        },
        {
          id: 'recents',
          label: 'Recent Projects',
          submenu: dataProviders.getRecentProjects().map(project => ({
            label: `${project.name} - ${project.projectFile}`,
            click: async () => {
              const {projectToOpen, isDirty} = dataProviders.getProjectToOpen(
                project.projectFile ?? '',
              );
              await callbacks.onLoadProject(projectToOpen, isDirty);
            },
          })),
        },
        {
          type: 'separator',
        },
        {
          id: 'close',
          label: 'Close Project',
          accelerator: 'CommandOrControl+W',
          click: async () => {
            await callbacks.onCloseProject();
          },
          enabled: hasCurrentProject,
        },
        {
          id: 'save',
          label: 'Save',
          accelerator: 'CommandOrControl+S',
          click: async () => {
            await callbacks.onSaveProject();
          },
          enabled: isCurrentProjectDirty && !isTutorial,
        },
        {
          id: 'save_as',
          label: 'Save as...',
          accelerator: 'CommandOrControl+Shift+S',
          click: async () => {
            await callbacks.onSaveAsProject();
          },
          enabled: hasCurrentProject && !isTutorial,
        },
        {
          type: 'separator',
        },
        {
          id: 'export',
          label: 'Export Selected',
          accelerator: 'CommandOrControl+E',
          click: () => {
            callbacks.sendToUI('export_clips', {});
          },
          enabled: exportEnabled && hasCurrentProject,
        },
        {
          id: 'export_all',
          label: 'Export All',
          accelerator: 'CommandOrControl+Shift+E',
          click: () => {
            callbacks.sendToUI('export_all_clips', {});
          },
          enabled: exportAllEnabled && hasCurrentProject,
        },
      ],
    };
  }

  /**
   * Builds the Edit menu
   */
  private buildEditMenu(
    options: MenuBuildOptions,
    emphasisState: EmphasisMenuState,
  ): MenuItemConstructorOptions {
    const {callbacks} = this.config;
    const {hasCurrentProject, defaultControls} = options;

    if (!hasCurrentProject) {
      return {
        id: 'edit',
        label: 'Edit',
        submenu: [
          {role: 'undo'},
          {role: 'redo'},
          {type: 'separator'},
          {role: 'cut'},
          {role: 'copy'},
          {role: 'paste'},
        ],
      };
    }

    const clipboardItems = this.buildClipboardItems(options);

    const undoItem = {
      id: 'undo',
      label: 'Undo',
      click: () => {
        callbacks.sendToUI('undo', {});
      },
      accelerator: 'CommandOrControl+Z',
    };

    const redoItem = {
      id: 'redo',
      label: 'Redo',
      click: () => {
        callbacks.sendToUI('redo', {});
      },
      accelerator: 'CommandOrControl+Shift+Z',
    };

    return {
      id: 'edit',
      label: 'Edit',
      submenu: [
        defaultControls ? {role: 'undo'} : undoItem,
        defaultControls ? {role: 'redo'} : redoItem,
        {
          type: 'separator',
        },
        {
          id: 'emphasis',
          label: 'Emphasis',
          type: 'checkbox',
          enabled: emphasisState.enabled && !defaultControls,
          checked: emphasisState.checked,
          click: () => {
            callbacks.sendToUI('emphasis', {});
          },
          accelerator: 'CommandOrControl+B',
        },
        ...clipboardItems,
      ],
    };
  }

  /**
   * Builds clipboard-related menu items (cut, copy, paste, etc.)
   */
  private buildClipboardItems(
    options: MenuBuildOptions,
  ): MenuItemConstructorOptions[] {
    const {callbacks} = this.config;
    const {hasCurrentProject, defaultControls} = options;

    const cutItem: MenuItemConstructorOptions = {
      id: 'cut',
      label: 'Cut',
      accelerator: 'CommandOrControl+X',
      click: () => {
        const action = 'cut';
        const message: IPCMessage = {action, status: 'ok', payload: {}};
        callbacks.sendToUI(action, message);
      },
      enabled: this.menuItemsToggleState[MenuToggleItem.copy] ?? false,
    };

    const copyItem: MenuItemConstructorOptions = {
      id: 'copy',
      label: 'Copy',
      accelerator: 'CommandOrControl+C',
      enabled: this.menuItemsToggleState[MenuToggleItem.copy] ?? false,
      click: () => {
        const action = 'copy';
        const message: IPCMessage = {action, status: 'ok', payload: {}};
        callbacks.sendToUI(action, message);
      },
    };

    const pasteItem: MenuItemConstructorOptions = {
      id: 'paste',
      label: 'Paste',
      accelerator: 'CommandOrControl+V',
      enabled: callbacks.isClipboardValid() && hasCurrentProject,
      click: () => {
        callbacks.sendClipboardContent('paste');
      },
    };

    const items: MenuItemConstructorOptions[] = [
      defaultControls ? {role: 'cut'} : cutItem,
      defaultControls ? {role: 'copy'} : copyItem,
      defaultControls ? {role: 'paste'} : pasteItem,
      {
        id: 'paste_in_place',
        label: 'Paste in place',
        accelerator: 'CommandOrControl+Shift+V',
        click: () => {
          callbacks.sendClipboardContent('paste_in_place');
        },
        enabled:
          callbacks.isClipboardValid() && hasCurrentProject && !defaultControls,
      },
      {
        id: 'paste_emphasis_in_place',
        label: 'Paste Emphasis in place',
        click: () => {
          callbacks.sendClipboardContent('paste_emphasis_in_place');
        },
        enabled:
          callbacks.isClipboardValid() && hasCurrentProject && !defaultControls,
      },
    ];

    items.push(
      {
        id: 'group',
        label: 'Group',
        accelerator: 'CommandOrControl+G',
        click: () => {
          const action = 'group';
          const message: IPCMessage = {action, status: 'ok', payload: {}};
          callbacks.sendToUI(action, message);
        },
        enabled:
          this.menuItemsToggleState[MenuToggleItem.group] && !defaultControls,
      },
      {
        id: 'ungroup',
        label: 'Ungroup',
        accelerator: 'CommandOrControl+Shift+G',
        click: () => {
          const action = 'ungroup';
          const message: IPCMessage = {action, status: 'ok', payload: {}};
          callbacks.sendToUI(action, message);
        },
        enabled:
          this.menuItemsToggleState[MenuToggleItem.ungroup] && !defaultControls,
      },
      {
        id: 'duplicate_clips',
        label: 'Duplicate Clips',
        accelerator: 'CommandOrControl+D',
        click: () => {
          const action = 'duplicate_clips';
          const message: IPCMessage = {action, status: 'ok', payload: {}};
          callbacks.sendToUI(action, message);
        },
        enabled:
          this.menuItemsToggleState[MenuToggleItem.duplicate_clips] &&
          !defaultControls,
      },
      defaultControls
        ? {role: 'selectAll'}
        : {
            id: 'select_all',
            label: 'Select All',
            accelerator: 'CommandOrControl+A',
            click: () => {
              callbacks.sendToUI('select_all');
            },
            enabled: this.menuItemsToggleState[MenuToggleItem.select_all],
          },
    );

    items.push({type: 'separator'});

    return items;
  }

  /**
   * Builds the Window menu
   */
  private buildWindowMenu(): MenuItemConstructorOptions {
    return {
      label: 'Window',
      submenu: [{role: 'minimize'}],
    };
  }

  /**
   * Builds the Help menu
   */
  private buildHelpMenu(): MenuItemConstructorOptions {
    const {dataProviders, callbacks} = this.config;

    return {
      label: 'Help',
      submenu: dataProviders.getHelpMenuItems().map(menuItem => {
        const {label, url} = menuItem;
        return {
          id: snakeCase(label),
          label,
          click: () => {
            void callbacks.openExternal(url);
          },
        };
      }),
    };
  }

  /**
   * Builds the developer tools menu (development mode only)
   */
  private buildDevToolsMenu(): MenuItemConstructorOptions {
    const {callbacks} = this.config;

    return {
      label: 'View',
      submenu: [
        {role: 'reload'},
        {role: 'toggleDevTools'},
        {
          id: 'show_changelog',
          label: 'Show Changelog',
          click: () => {
            const releaseNotesPath = callbacks.getReleaseNotesPath?.();
            if (releaseNotesPath && fs.existsSync(releaseNotesPath)) {
              callbacks.sendToUI('update_available', {
                releaseDate: new Date().toISOString(),
                releaseNotes: fs.readFileSync(releaseNotesPath).toString(),
                version: callbacks.getAppVersion(),
                files: [],
                path: '',
                sha512: '',
              });
            }
          },
        },
      ],
    };
  }
}
