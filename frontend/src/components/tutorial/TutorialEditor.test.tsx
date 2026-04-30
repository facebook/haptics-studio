/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';
import userEvent from '@testing-library/user-event';
import {
  render,
  cleanup,
  RenderResult,
  fireEvent,
  waitFor,
} from '../../test-utils';
import TutorialEditor from './TutorialEditor';
import clipMock from '../../__mocks__/clipMock';
import actions from '../../state/actions';

afterEach(cleanup);

const dispatchMock = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => dispatchMock,
}));

const renderSubject = (options: {showPreview?: boolean}): RenderResult => {
  const {showPreview = false} = options;
  const clip = clipMock({});
  clip.notes = 'Hello';
  return render(<TutorialEditor />, {
    selectors: {
      app: {
        getTutorialEditorState: () => ({
          showPreview,
          showSettings: false,
        }),
      },
      project: {
        getSessionId: () => 'session1',
        getProjectInfo: () => ({slug: 'test-project', isTutorial: true}),
        getCurrentClip: () => clip,
        getCurrentClipId: () => 'clip1',
      },
    },
  });
};

describe('<TutorialEditor />', () => {
  afterEach(() => {
    dispatchMock.mockClear();
  });

  it('renders the main component with the preview open', () => {
    const element = renderSubject({showPreview: true});
    expect(element).toMatchSnapshot();

    element.getByTestId('preview-button').click();
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.app.showTutorialPreview({visible: false}),
    );
  });

  it('renders the main component with the preview closed', () => {
    const element = renderSubject({});
    expect(element).toMatchSnapshot();
  });

  it('should open the tutorial settings panel', () => {
    const element = renderSubject({});
    element.getByTestId('settings-button').click();
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.app.showTutorialSettings({visible: true}),
    );
  });

  it('should update the notes on user input', async () => {
    const user = userEvent.setup();

    const element = renderSubject({});
    const input: HTMLTextAreaElement = element.getByRole(
      'textbox',
    ) as HTMLTextAreaElement;
    fireEvent.focus(input);
    dispatchMock.mockClear();
    await user.type(input, 'World');
    expect(input.value).toBe('HelloWorld');
    await waitFor(() =>
      expect(dispatchMock).toHaveBeenCalledWith(
        actions.project.updateTutorialNotes({
          clipId: 'clip1',
          notes: 'HelloWorld',
        }),
      ),
    );
  });
});
