/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';
import {wrapWithTestBackend} from 'react-dnd-test-utils';

import {render, cleanup, RenderResult} from '../../../test-utils';
import Navigator from './Navigator';
import {FocusArea} from '../../../state/types';
import clipMock from '../../../__mocks__/clipMock';
import actions from '../../../state/actions';

afterEach(cleanup);

const dispatchMock = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => dispatchMock,
}));

const renderSubject = (): RenderResult => {
  const clips = [clipMock({name: 'clip1'})];
  const TestNavigator = wrapWithTestBackend(Navigator)[0];

  return render(<TestNavigator isDragAccept />, {
    selectors: {
      project: {
        getProjectInfo: () => ({
          isOpen: true,
          name: 'Project name',
          description: '',
          category: '',
          slug: '',
          version: '',
          isSample: false,
          isTutorial: false,
          isAuthoringTutorial: false,
        }),
        getClips: () => ({clip1: clips[0]}),
        getCurrentClipId: () => 'clip1',
        getSelectedClips: () => [],
        getSelection: () => ({clips: [], groups: []}),
        getGroups: () => [],
        getClipIds: () => ['clip1'],
      },
      app: {
        getFocus: () => FocusArea.Navigator,
        getOverlays: () => ({contextMenu: undefined}),
        getDefaultControlStatus: () => true,
        isOnWindows: () => false,
      },
    },
  });
};

describe('<Navigator />', () => {
  afterEach(() => {
    dispatchMock.mockClear();
  });

  it('renders the main component', () => {
    const element = renderSubject();
    expect(element).toMatchSnapshot();
  });

  it('opens the bug report dialog', () => {
    const subject = renderSubject();
    subject.getByTestId('header-bugreport-button').click();
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.app.showBugReportDialog(),
    );
  });
});
