/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';
import userEvent from '@testing-library/user-event';

import {render, cleanup, RenderResult} from '../../test-utils';
import TutorialSettings from './TutorialSettings';
import clipMock from '../../__mocks__/clipMock';
import actions from '../../state/actions';

afterEach(cleanup);

const dispatchMock = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => dispatchMock,
}));

const renderSubject = (options: {
  isAuthoringTutorial?: boolean;
}): RenderResult => {
  const {isAuthoringTutorial = true} = options;
  const clip = clipMock({});
  clip.notes = 'Hello';
  return render(<TutorialSettings />, {
    selectors: {
      project: {
        getSessionId: () => 'session1',
        getProjectInfo: () => ({
          category: 'beginner',
          description: 'tutorial description',
          slug: 'test-project',
          version: '1.0',
          isAuthoringTutorial,
        }),
      },
    },
  });
};

describe('<TutorialSettings />', () => {
  afterEach(() => {
    dispatchMock.mockClear();
  });

  it('renders the main component', () => {
    const element = renderSubject({});
    expect(element).toMatchSnapshot();
    expect(element.getByDisplayValue('1.0')).toBeVisible();
    expect(element.getByDisplayValue('tutorial description')).toBeVisible();
    expect(element.getByText('Beginner')).toBeVisible();
    expect(element.getByDisplayValue('test-project')).toBeVisible();
  });

  it('should update the project metadata and dismissed on Confirm', async () => {
    const user = userEvent.setup();
    const element = renderSubject({});

    dispatchMock.mockClear();
    let input = element.getByTestId('description-input');
    await user.type(input, ' 2');
    input = element.getByTestId('slug-input');
    await user.type(input, '-2');
    input = element.getByTestId('version-input');
    await user.type(input, '.0');

    element.getByText('Save').click();
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.project.updateMetadata({
        metadata: {
          slug: 'test-project-2',
          category: 'beginner',
          description: 'tutorial description 2',
          version: '1.0.0',
        },
      }),
    );
  });

  it('can be dismissed', () => {
    const element = renderSubject({});
    element.getByTestId('close-button').click();
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.app.showTutorialSettings({visible: false}),
    );
  });
});
