/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';
import {ipcRenderer} from 'electron';
import {render, cleanup, RenderResult, fireEvent} from '../../test-utils';
import TutorialNavigator from './TutorialNavigator';
import clipMock from '../../__mocks__/clipMock';
import actions from '../../state/actions';
import {FocusArea} from '../../state/types';

afterEach(cleanup);

const dispatchMock = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => dispatchMock,
}));

jest.mock('electron', () => ({
  ipcRenderer: {
    removeAllListeners: jest.fn(),
    invoke: jest.fn(),
    send: jest.fn(),
    on: jest.fn(),
  },
}));

const renderSubject = (): RenderResult => {
  const clips = [
    clipMock({name: 'clip1'}),
    clipMock({name: 'clip2'}),
    clipMock({name: 'clip3'}),
  ];

  return render(<TutorialNavigator />, {
    selectors: {
      app: {
        getFocus: () => FocusArea.Navigator,
      },
      project: {
        getSessionId: () => 'session1',
        getProjectInfo: () => ({
          slug: 'test-project',
          isTutorial: true,
          version: '1.0',
        }),
        getCurrentClipId: () => 'clip1',
        getClipIds: () => ['clip1', 'clip2', 'clip3'],
        getClips: () => ({clip1: clips[0], clip2: clips[1], clip3: clips[2]}),
        getGroups: () => [
          {
            id: 'group1',
            name: 'group',
            clips: ['clip1', 'clip2'],
            isFolder: true,
          },
          {id: 'group2', name: 'single', clips: ['clip3'], isFolder: false},
        ],
      },
    },
  });
};

describe('<TutorialEditor />', () => {
  beforeAll(() => {
    // scrollBy is not implemented in jsdom
    window.HTMLElement.prototype.scrollBy = function () {};
  });

  afterEach(() => {
    dispatchMock.mockClear();
    localStorage.clear();
  });

  it('renders the main component', () => {
    const element = renderSubject();
    expect(element).toMatchSnapshot();
  });

  // @oss-disable
  // @oss-disable
    // @oss-disable
    // @oss-disable
    // @oss-disable
    // @oss-disable
      // @oss-disable
      // @oss-disable
      // @oss-disable
        // @oss-disable
        // @oss-disable
          // @oss-disable
          // @oss-disable
          // @oss-disable
        // @oss-disable
      // @oss-disable
    // @oss-disable
  // @oss-disable

  it('should handle the keyboard navigation', () => {
    const element = renderSubject();
    fireEvent.keyDown(element.baseElement, {key: 'ArrowDown'});
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.project.setAndSelectNextClip(),
    );
    dispatchMock.mockClear();
    fireEvent.keyDown(element.baseElement, {key: 'ArrowUp'});
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.project.setAndSelectPreviousClip(),
    );
  });

  it('should handle the clip selection', () => {
    const element = renderSubject();
    element.getByText('clip2').click();
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.project.setCurrentClip({id: 'clip2'}),
    );
  });
});
