/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';
import {render, cleanup, RenderResult} from '../../test-utils';
import WindowHeader from './WindowHeader';
import actions from '../../state/actions';

afterEach(cleanup);

const dispatchMock = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => dispatchMock,
}));

const renderSubject = (options: {
  projectOpen: boolean;
  termsAccepted?: boolean;
  dirty?: boolean;
}): RenderResult => {
  const {projectOpen, termsAccepted = true, dirty = false} = options;
  return render(<WindowHeader />, {
    selectors: {
      project: {
        getProjectInfo: () => ({
          isOpen: projectOpen,
          name: 'Project-01',
          description: '',
          category: '',
          slug: '',
          version: '',
          isSample: false,
          isTutorial: false,
          isAuthoringTutorial: false,
        }),
        getClipsCount: () => (projectOpen ? 1 : 0),
      },
      app: {
        getWindowInformation: () => ({
          size: [1920, 1080],
          projectName: 'Project-01',
          isCurrentProjectDirty: dirty,
        }),
        isOnWindows: () => false,
        areTermsAccepted: () => termsAccepted,
        getUpdaterInfo: () => ({
          progress: null,
          downloaded: false,
          showDialog: false,
        }),
        getLandingPageSection: () => 'projects',
      },
    },
  });
};

describe('<WindowHeader />', () => {
  afterEach(() => {
    dispatchMock.mockClear();
  });

  it('requests the device status on mount', () => {
    renderSubject({projectOpen: false});
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.app.requestDevicesStatus(),
    );
  });

  it('renders an empty view when the terms screen is visible', () => {
    const subject = renderSubject({projectOpen: false, termsAccepted: false});
    expect(subject).toMatchSnapshot();
  });

  it('allows to get back to the home', () => {
    const subject = renderSubject({projectOpen: true});
    expect(subject.getByText('Projects')).toBeInTheDocument();
    subject.getByText('Projects').click();
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.project.closeCurrentProject(),
    );
  });
});
