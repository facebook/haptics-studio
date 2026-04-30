/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';

import {render, cleanup} from '../../test-utils';
import AndroidExport from './AndroidExport';
import {ExportDefaultFormatOption} from '../../globals/constants';
import {ExportState} from '../../state/app/types';

afterEach(cleanup);

const dispatchMock = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => dispatchMock,
}));
jest.mock('electron', () => ({
  ipcRenderer: {
    send: jest.fn(),
    invoke: jest.fn(),
  },
}));
window.localStorage.setItem = jest.fn();

const renderSubject = (options: {
  clips?: string[];
  status?: ExportState;
  initialFormat?: string;
}) => {
  const {
    clips = ['clip1'],
    status = 'none',
    initialFormat = 'haptic',
  } = options;
  window.localStorage.setItem(ExportDefaultFormatOption, initialFormat);
  return render(<AndroidExport />, {
    selectors: {app: {getExportDialog: () => ({clips, status})}},
  });
};

describe('<AndroidExport />', () => {
  it('should ...', () => {
    const element = renderSubject({});
    expect(element.container).toBeValid();
  });
});
