/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import createIPCMock from 'electron-mock-ipc';

const {ipcMain, ipcRenderer} = createIPCMock();
const dialog = {
  showSaveDialogSync: jest.fn(),
  showOpenDialogSync: jest.fn(),
  showMessageBoxSync: jest.fn(),
};
const clipboard = {
  readText: jest.fn(),
  writeText: jest.fn(),
};

const app = {
  on: jest.fn(),
  isReady: jest.fn(),
  quit: jest.fn(),
  exit: jest.fn(),
  setPath: jest.fn(),
  getPath: (): string => {
    return '';
  },
  getVersion: jest.fn(),
};

// Store mock menu items for retrieval
const mockMenuItems: Map<string, Record<string, unknown>> = new Map();

// Use regular functions instead of jest.fn() to survive resetMocks: true
const MenuItem = (
  options: Record<string, unknown>,
): Record<string, unknown> => {
  return {
    id: options.id,
    label: options.label,
    enabled: options.enabled ?? true,
    checked: options.checked ?? false,
    click: options.click,
    type: options.type,
    role: options.role,
    submenu: options.submenu,
  };
};

let buildFromTemplateCalls: Record<string, unknown>[][] = [];

const buildFromTemplateImpl = (template: Record<string, unknown>[]) => {
  buildFromTemplateCalls.push(template);
  mockMenuItems.clear();

  const processTemplate = (items: Record<string, unknown>[]) => {
    items.forEach(item => {
      if (item.id) {
        const menuItem = {
          id: item.id,
          label: item.label,
          enabled: item.enabled ?? true,
          checked: item.checked ?? false,
          click: item.click,
          type: item.type,
          role: item.role,
          submenu: item.submenu,
        };
        mockMenuItems.set(item.id as string, menuItem);
      }
      if (Array.isArray(item.submenu)) {
        processTemplate(item.submenu as Record<string, unknown>[]);
      }
    });
  };

  processTemplate(template);

  return {
    getMenuItemById: (id: string) => {
      const item = mockMenuItems.get(id);
      return item ?? null;
    },
    items: template,
  };
};

const Menu = {
  buildFromTemplate: Object.assign(buildFromTemplateImpl, {
    mock: {
      get calls() {
        return buildFromTemplateCalls.map(args => [args]);
      },
      clear() {
        buildFromTemplateCalls = [];
      },
    },
    mockClear() {
      buildFromTemplateCalls = [];
    },
  }),
  setApplicationMenu: jest.fn(),
};

export {
  ipcMain,
  ipcRenderer,
  dialog,
  clipboard,
  app,
  Menu,
  MenuItem,
  mockMenuItems,
};
