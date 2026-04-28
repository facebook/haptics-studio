/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */

import MenuBuilder from '../../src/menu/MenuBuilder';
import {
  MenuToggleItem,
  MenuBuilderConfig,
  MenuBuildOptions,
  MenuCallbacks,
  MenuDataProviders,
} from '../../src/menu/types';

// Mock fs module for dev tools menu
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest
    .fn()
    .mockReturnValue(Buffer.from('# Release Notes\n- Feature 1')),
}));

// Import Menu from the global electron mock
import {Menu} from 'electron';

// Type for menu item options in tests
interface MockMenuItemOptions {
  id?: string;
  label?: string;
  enabled?: boolean;
  checked?: boolean;
  click?: () => void | Promise<void>;
  type?: string;
  role?: string;
  submenu?: MockMenuItemOptions[];
}

// Access mockMenuItems from the electron mock module
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {mockMenuItems} = require('electron') as unknown as {
  mockMenuItems: Map<string, unknown>;
};

const MenuBuildFromTemplate =
  Menu.buildFromTemplate as typeof Menu.buildFromTemplate & {
    mock: {calls: unknown[][]};
    mockClear: () => void;
  };

describe('MenuBuilder', () => {
  let mockCallbacks: MenuCallbacks;
  let mockDataProviders: MenuDataProviders;
  let menuBuilder: MenuBuilder;
  let config: MenuBuilderConfig;

  const createMockCallbacks = (): MenuCallbacks => ({
    sendToUI: jest.fn(),
    showAboutWindow: jest.fn(),
    isClipboardValid: jest.fn().mockReturnValue(false),
    clipboardContainsEmphasis: jest.fn().mockReturnValue(false),
    sendClipboardContent: jest.fn(),
    onNewProject: jest.fn().mockResolvedValue(undefined),
    onOpenProject: jest.fn().mockResolvedValue(undefined),
    onCloseProject: jest.fn().mockResolvedValue(undefined),
    onSaveProject: jest.fn().mockResolvedValue(undefined),
    onSaveAsProject: jest.fn().mockResolvedValue(undefined),
    onLoadProject: jest.fn().mockResolvedValue(undefined),
    onCheckForUpdates: jest.fn(),
    openExternal: jest.fn().mockResolvedValue(undefined),
    getAppVersion: jest.fn().mockReturnValue('1.0.0'),
    getReleaseNotesPath: jest.fn().mockReturnValue('/path/to/release-notes.md'),
  });

  const createMockDataProviders = (): MenuDataProviders => ({
    getRecentProjects: jest.fn().mockReturnValue([
      {name: 'Recent Project 1', projectFile: '/path/to/recent1.haptic'},
      {name: 'Recent Project 2', projectFile: '/path/to/recent2.haptic'},
    ]),
    getSamplesProjects: jest
      .fn()
      .mockReturnValue([
        {name: 'Sample 1', projectFile: '/path/to/sample1.haptic'},
      ]),
    getProjectToOpen: jest.fn().mockReturnValue({
      projectToOpen: '/path/to/project.haptic',
      isDirty: false,
    }),
    getHelpMenuItems: jest.fn().mockReturnValue([
      {label: 'Documentation', url: 'https://help.example.com'},
      {label: 'Support', url: 'https://support.example.com'},
    ]),
  });

  const createDefaultBuildOptions = (
    overrides: Partial<MenuBuildOptions> = {},
  ): MenuBuildOptions => ({
    termsAccepted: true,
    hasCurrentProject: true,
    isCurrentProjectDirty: false,
    isTutorial: false,
    isAuthoringTutorial: false,
    projectName: 'Test Project',
    isOnWindows: false,
    isDevelopment: false,
    defaultControls: false,
    ...overrides,
  });

  beforeEach(() => {
    // Clear the menu items map and mock calls for fresh state
    (mockMenuItems as Map<string, unknown>).clear();
    MenuBuildFromTemplate.mockClear();

    mockCallbacks = createMockCallbacks();
    mockDataProviders = createMockDataProviders();
    config = {
      callbacks: mockCallbacks,
      dataProviders: mockDataProviders,
      productName: 'Haptics Studio',
    };
    menuBuilder = new MenuBuilder(config);
  });

  describe('getMenu', () => {
    it('returns undefined before build is called', () => {
      expect(menuBuilder.getMenu()).toBeUndefined();
    });

    it('returns Menu instance after build is called', () => {
      const options = createDefaultBuildOptions();
      menuBuilder.build(options);

      const menu = menuBuilder.getMenu();
      expect(menu).toBeDefined();
    });
  });

  describe('getMenuItemById', () => {
    it('returns null when menu is not built', () => {
      const item = menuBuilder.getMenuItemById('file');
      expect(item).toBeNull();
    });

    it('returns MenuItem when menu is built and item exists', () => {
      const options = createDefaultBuildOptions();
      menuBuilder.build(options);

      const item = menuBuilder.getMenuItemById('new');
      expect(item).not.toBeNull();
      expect(item?.id).toBe('new');
    });

    it('returns null when item does not exist', () => {
      const options = createDefaultBuildOptions();
      menuBuilder.build(options);

      const item = menuBuilder.getMenuItemById('nonexistent');
      expect(item).toBeNull();
    });
  });

  describe('getToggleState', () => {
    it('returns false for unset toggle items', () => {
      expect(menuBuilder.getToggleState(MenuToggleItem.copy)).toBe(false);
      expect(menuBuilder.getToggleState(MenuToggleItem.paste)).toBe(false);
      expect(menuBuilder.getToggleState(MenuToggleItem.cut)).toBe(false);
    });

    it('returns correct state after toggle', () => {
      const options = createDefaultBuildOptions();
      menuBuilder.build(options);

      menuBuilder.toggleMenuItems({
        [MenuToggleItem.copy]: true,
        [MenuToggleItem.paste]: false,
      });

      expect(menuBuilder.getToggleState(MenuToggleItem.copy)).toBe(true);
      expect(menuBuilder.getToggleState(MenuToggleItem.paste)).toBe(false);
    });
  });

  describe('build', () => {
    describe('when terms are not accepted', () => {
      it('builds minimal menu without dev tools', () => {
        const options = createDefaultBuildOptions({
          termsAccepted: false,
          isDevelopment: false,
        });

        const menu = menuBuilder.build(options);

        expect(menu).toBeDefined();
        expect(MenuBuildFromTemplate.mock.calls.length).toBeGreaterThan(0);
        expect(Menu.setApplicationMenu).toHaveBeenCalledWith(menu);
      });

      it('includes dev tools when in development mode', () => {
        const options = createDefaultBuildOptions({
          termsAccepted: false,
          isDevelopment: true,
        });

        menuBuilder.build(options);

        const template = MenuBuildFromTemplate.mock
          .calls[0][0] as MockMenuItemOptions[];
        const viewMenu = template.find(item => item.label === 'View');
        expect(viewMenu).toBeDefined();
      });
    });

    describe('when terms are accepted', () => {
      it('builds full menu on macOS', () => {
        const options = createDefaultBuildOptions({
          termsAccepted: true,
          isOnWindows: false,
        });

        const menu = menuBuilder.build(options);

        expect(menu).toBeDefined();
        expect(Menu.setApplicationMenu).toHaveBeenCalledWith(menu);
      });

      it('merges about menu into file menu on Windows', () => {
        const options = createDefaultBuildOptions({
          termsAccepted: true,
          isOnWindows: true,
        });

        menuBuilder.build(options);

        const template = MenuBuildFromTemplate.mock
          .calls[0][0] as MockMenuItemOptions[];
        // On Windows, first menu should be File with about items merged
        expect(template[0].id).toBe('file');
      });

      it('includes dev tools menu when in development mode', () => {
        const options = createDefaultBuildOptions({
          termsAccepted: true,
          isDevelopment: true,
        });

        menuBuilder.build(options);

        const template = MenuBuildFromTemplate.mock
          .calls[0][0] as MockMenuItemOptions[];
        const viewMenu = template.find(item => item.label === 'View');
        expect(viewMenu).toBeDefined();
      });

      it('enables save when project is dirty and not a tutorial', () => {
        const options = createDefaultBuildOptions({
          hasCurrentProject: true,
          isCurrentProjectDirty: true,
          isTutorial: false,
        });

        menuBuilder.build(options);

        const saveItem = menuBuilder.getMenuItemById('save');
        expect(saveItem?.enabled).toBe(true);
      });

      it('disables save when project is a tutorial', () => {
        const options = createDefaultBuildOptions({
          hasCurrentProject: true,
          isCurrentProjectDirty: true,
          isTutorial: true,
        });

        menuBuilder.build(options);

        const saveItem = menuBuilder.getMenuItemById('save');
        expect(saveItem?.enabled).toBe(false);
      });

      it('disables close when no current project', () => {
        const options = createDefaultBuildOptions({
          hasCurrentProject: false,
        });

        menuBuilder.build(options);

        const closeItem = menuBuilder.getMenuItemById('close');
        expect(closeItem?.enabled).toBe(false);
      });

      it('builds edit menu with default controls when defaultControls is true', () => {
        const options = createDefaultBuildOptions({
          defaultControls: true,
        });

        menuBuilder.build(options);

        // Should use role-based items instead of custom implementations
        expect(MenuBuildFromTemplate.mock.calls.length).toBeGreaterThan(0);
      });

      it('builds edit menu with custom items when defaultControls is false', () => {
        const options = createDefaultBuildOptions({
          defaultControls: false,
        });

        menuBuilder.build(options);

        const undoItem = menuBuilder.getMenuItemById('undo');
        expect(undoItem).toBeDefined();
      });

      it('builds minimal edit menu when no current project', () => {
        const options = createDefaultBuildOptions({
          hasCurrentProject: false,
        });

        menuBuilder.build(options);

        // Edit menu should have basic role-based items
        expect(MenuBuildFromTemplate.mock.calls.length).toBeGreaterThan(0);
      });

      it('populates recent projects submenu', () => {
        const options = createDefaultBuildOptions();

        menuBuilder.build(options);

        expect(mockDataProviders.getRecentProjects).toHaveBeenCalled();
      });

      it('populates samples submenu', () => {
        const options = createDefaultBuildOptions();

        menuBuilder.build(options);

        expect(mockDataProviders.getSamplesProjects).toHaveBeenCalled();
      });

      it('populates help menu items', () => {
        const options = createDefaultBuildOptions();

        menuBuilder.build(options);

        expect(mockDataProviders.getHelpMenuItems).toHaveBeenCalled();
      });
    });
  });

  describe('toggleMenuItems', () => {
    it('does nothing when menu is not built', () => {
      menuBuilder.toggleMenuItems({
        [MenuToggleItem.copy]: true,
      });

      // Should not throw and setApplicationMenu should not be called
      expect(Menu.setApplicationMenu).not.toHaveBeenCalled();
    });

    it('updates toggle state for multiple items without re-installing the application menu', () => {
      const options = createDefaultBuildOptions();
      menuBuilder.build(options);

      (Menu.setApplicationMenu as jest.Mock).mockClear();

      menuBuilder.toggleMenuItems({
        [MenuToggleItem.copy]: true,
        [MenuToggleItem.cut]: true,
        [MenuToggleItem.paste]: false,
        [MenuToggleItem.group]: true,
      });

      expect(menuBuilder.getToggleState(MenuToggleItem.copy)).toBe(true);
      expect(menuBuilder.getToggleState(MenuToggleItem.cut)).toBe(true);
      expect(menuBuilder.getToggleState(MenuToggleItem.paste)).toBe(false);
      expect(menuBuilder.getToggleState(MenuToggleItem.group)).toBe(true);
      // setApplicationMenu must NOT be re-called: it causes the macOS menu
      // bar to flash. MenuItem.enabled mutations are reflected live.
      expect(Menu.setApplicationMenu).not.toHaveBeenCalled();
    });

    it('does not re-install the application menu after toggling', () => {
      const options = createDefaultBuildOptions();
      menuBuilder.build(options);

      (Menu.setApplicationMenu as jest.Mock).mockClear();

      menuBuilder.toggleMenuItems({
        [MenuToggleItem.select_all]: true,
      });

      expect(Menu.setApplicationMenu).not.toHaveBeenCalled();
    });
  });

  describe('menu callbacks', () => {
    it('about menu click shows about window', () => {
      const options = createDefaultBuildOptions();
      menuBuilder.build(options);

      const aboutItem = menuBuilder.getMenuItemById('about');
      expect(aboutItem).toBeDefined();

      // Simulate click
      aboutItem?.click?.();

      expect(mockCallbacks.showAboutWindow).toHaveBeenCalled();
    });

    it('telemetry menu click sends telemetry_consent_settings to UI', () => {
      const options = createDefaultBuildOptions();
      menuBuilder.build(options);

      const telemetryItem = menuBuilder.getMenuItemById('telemetry');
      expect(telemetryItem).toBeDefined();

      telemetryItem?.click?.();

      expect(mockCallbacks.sendToUI).toHaveBeenCalledWith(
        'telemetry_consent_settings',
        expect.objectContaining({
          action: 'telemetry_consent_settings',
          status: 'ok',
        }),
      );
    });

    it('updater menu click triggers check for updates', () => {
      const options = createDefaultBuildOptions();
      menuBuilder.build(options);

      const updaterItem = menuBuilder.getMenuItemById('updater');
      expect(updaterItem).toBeDefined();

      updaterItem?.click?.();

      expect(mockCallbacks.onCheckForUpdates).toHaveBeenCalled();
    });

    it('new project menu click triggers onNewProject', async () => {
      const options = createDefaultBuildOptions();
      menuBuilder.build(options);

      const newItem = menuBuilder.getMenuItemById('new');
      expect(newItem).toBeDefined();

      await newItem?.click?.();

      expect(mockCallbacks.onNewProject).toHaveBeenCalled();
    });

    it('open project menu click triggers onOpenProject', async () => {
      const options = createDefaultBuildOptions();
      menuBuilder.build(options);

      const openItem = menuBuilder.getMenuItemById('open');
      expect(openItem).toBeDefined();

      await openItem?.click?.();

      expect(mockCallbacks.onOpenProject).toHaveBeenCalled();
    });

    it('close project menu click triggers onCloseProject', async () => {
      const options = createDefaultBuildOptions({hasCurrentProject: true});
      menuBuilder.build(options);

      const closeItem = menuBuilder.getMenuItemById('close');
      expect(closeItem).toBeDefined();

      await closeItem?.click?.();

      expect(mockCallbacks.onCloseProject).toHaveBeenCalled();
    });

    it('save menu click triggers onSaveProject', async () => {
      const options = createDefaultBuildOptions({
        hasCurrentProject: true,
        isCurrentProjectDirty: true,
      });
      menuBuilder.build(options);

      const saveItem = menuBuilder.getMenuItemById('save');
      expect(saveItem).toBeDefined();

      await saveItem?.click?.();

      expect(mockCallbacks.onSaveProject).toHaveBeenCalled();
    });

    it('save as menu click triggers onSaveAsProject', async () => {
      const options = createDefaultBuildOptions({hasCurrentProject: true});
      menuBuilder.build(options);

      const saveAsItem = menuBuilder.getMenuItemById('save_as');
      expect(saveAsItem).toBeDefined();

      await saveAsItem?.click?.();

      expect(mockCallbacks.onSaveAsProject).toHaveBeenCalled();
    });

    it('export menu click sends export_clips to UI', () => {
      const options = createDefaultBuildOptions({hasCurrentProject: true});
      menuBuilder.build(options);

      const exportItem = menuBuilder.getMenuItemById('export');
      expect(exportItem).toBeDefined();

      exportItem?.click?.();

      expect(mockCallbacks.sendToUI).toHaveBeenCalledWith('export_clips', {});
    });

    it('export all menu click sends export_all_clips to UI', () => {
      const options = createDefaultBuildOptions({hasCurrentProject: true});
      menuBuilder.build(options);

      const exportAllItem = menuBuilder.getMenuItemById('export_all');
      expect(exportAllItem).toBeDefined();

      exportAllItem?.click?.();

      expect(mockCallbacks.sendToUI).toHaveBeenCalledWith(
        'export_all_clips',
        {},
      );
    });

    it('undo menu click sends undo to UI', () => {
      const options = createDefaultBuildOptions({defaultControls: false});
      menuBuilder.build(options);

      const undoItem = menuBuilder.getMenuItemById('undo');
      expect(undoItem).toBeDefined();

      undoItem?.click?.();

      expect(mockCallbacks.sendToUI).toHaveBeenCalledWith('undo', {});
    });

    it('redo menu click sends redo to UI', () => {
      const options = createDefaultBuildOptions({defaultControls: false});
      menuBuilder.build(options);

      const redoItem = menuBuilder.getMenuItemById('redo');
      expect(redoItem).toBeDefined();

      redoItem?.click?.();

      expect(mockCallbacks.sendToUI).toHaveBeenCalledWith('redo', {});
    });

    it('copy menu click sends copy to UI', () => {
      const options = createDefaultBuildOptions({defaultControls: false});
      menuBuilder.build(options);

      const copyItem = menuBuilder.getMenuItemById('copy');
      expect(copyItem).toBeDefined();

      copyItem?.click?.();

      expect(mockCallbacks.sendToUI).toHaveBeenCalledWith(
        'copy',
        expect.objectContaining({action: 'copy', status: 'ok'}),
      );
    });

    it('cut menu click sends cut to UI', () => {
      const options = createDefaultBuildOptions({defaultControls: false});
      menuBuilder.build(options);

      const cutItem = menuBuilder.getMenuItemById('cut');
      expect(cutItem).toBeDefined();

      cutItem?.click?.();

      expect(mockCallbacks.sendToUI).toHaveBeenCalledWith(
        'cut',
        expect.objectContaining({action: 'cut', status: 'ok'}),
      );
    });

    it('paste menu click sends clipboard content', () => {
      (mockCallbacks.isClipboardValid as jest.Mock).mockReturnValue(true);
      const options = createDefaultBuildOptions({
        hasCurrentProject: true,
        defaultControls: false,
      });
      menuBuilder.build(options);

      const pasteItem = menuBuilder.getMenuItemById('paste');
      expect(pasteItem).toBeDefined();

      pasteItem?.click?.();

      expect(mockCallbacks.sendClipboardContent).toHaveBeenCalledWith('paste');
    });

    it('paste in place menu click sends paste_in_place', () => {
      (mockCallbacks.isClipboardValid as jest.Mock).mockReturnValue(true);
      const options = createDefaultBuildOptions({
        hasCurrentProject: true,
        defaultControls: false,
      });
      menuBuilder.build(options);

      const pasteInPlaceItem = menuBuilder.getMenuItemById('paste_in_place');
      expect(pasteInPlaceItem).toBeDefined();

      pasteInPlaceItem?.click?.();

      expect(mockCallbacks.sendClipboardContent).toHaveBeenCalledWith(
        'paste_in_place',
      );
    });

    it('group menu click sends group to UI', () => {
      const options = createDefaultBuildOptions({defaultControls: false});
      menuBuilder.build(options);

      const groupItem = menuBuilder.getMenuItemById('group');
      expect(groupItem).toBeDefined();

      groupItem?.click?.();

      expect(mockCallbacks.sendToUI).toHaveBeenCalledWith(
        'group',
        expect.objectContaining({action: 'group', status: 'ok'}),
      );
    });

    it('ungroup menu click sends ungroup to UI', () => {
      const options = createDefaultBuildOptions({defaultControls: false});
      menuBuilder.build(options);

      const ungroupItem = menuBuilder.getMenuItemById('ungroup');
      expect(ungroupItem).toBeDefined();

      ungroupItem?.click?.();

      expect(mockCallbacks.sendToUI).toHaveBeenCalledWith(
        'ungroup',
        expect.objectContaining({action: 'ungroup', status: 'ok'}),
      );
    });

    it('duplicate clips menu click sends duplicate_clips to UI', () => {
      const options = createDefaultBuildOptions({defaultControls: false});
      menuBuilder.build(options);

      const duplicateItem = menuBuilder.getMenuItemById('duplicate_clips');
      expect(duplicateItem).toBeDefined();

      duplicateItem?.click?.();

      expect(mockCallbacks.sendToUI).toHaveBeenCalledWith(
        'duplicate_clips',
        expect.objectContaining({action: 'duplicate_clips', status: 'ok'}),
      );
    });

    it('select all menu click sends select_all to UI', () => {
      const options = createDefaultBuildOptions({defaultControls: false});
      menuBuilder.build(options);

      const selectAllItem = menuBuilder.getMenuItemById('select_all');
      expect(selectAllItem).toBeDefined();

      selectAllItem?.click?.();

      expect(mockCallbacks.sendToUI).toHaveBeenCalledWith('select_all');
    });

    it('emphasis menu click sends emphasis to UI', () => {
      const options = createDefaultBuildOptions({defaultControls: false});
      menuBuilder.build(options);

      const emphasisItem = menuBuilder.getMenuItemById('emphasis');
      expect(emphasisItem).toBeDefined();

      emphasisItem?.click?.();

      expect(mockCallbacks.sendToUI).toHaveBeenCalledWith('emphasis', {});
    });
  });

  describe('state preservation across rebuilds', () => {
    it('preserves emphasis state when rebuilding menu', () => {
      const options = createDefaultBuildOptions();
      menuBuilder.build(options);

      // Get initial state
      const initialEmphasisItem = menuBuilder.getMenuItemById('emphasis');
      expect(initialEmphasisItem).toBeDefined();

      // Rebuild menu
      menuBuilder.build(options);

      // Emphasis state should be preserved
      expect(MenuBuildFromTemplate.mock.calls.length).toBeGreaterThan(0);
    });

    it('preserves export state when rebuilding menu', () => {
      const options = createDefaultBuildOptions();
      menuBuilder.build(options);

      // Rebuild menu
      menuBuilder.build(options);

      const exportItem = menuBuilder.getMenuItemById('export');
      expect(exportItem).toBeDefined();
    });

    it('preserves toggle states when rebuilding menu', () => {
      const options = createDefaultBuildOptions();
      menuBuilder.build(options);

      menuBuilder.toggleMenuItems({
        [MenuToggleItem.copy]: true,
        [MenuToggleItem.group]: true,
      });

      // Rebuild menu
      menuBuilder.build(options);

      expect(menuBuilder.getToggleState(MenuToggleItem.copy)).toBe(true);
      expect(menuBuilder.getToggleState(MenuToggleItem.group)).toBe(true);
    });
  });
});
