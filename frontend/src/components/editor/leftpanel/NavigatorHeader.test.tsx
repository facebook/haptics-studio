/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';

import {
  render,
  cleanup,
  RenderResult,
  waitFor,
  fireEvent,
} from '../../../test-utils';
import NavigatorHeader from './NavigatorHeader';
import actions from '../../../state/actions';

afterEach(cleanup);

const dispatchMock = jest.fn();
const newAudioMock = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => dispatchMock,
}));

const renderSubject = (options: {
  clipCount: number;
  isOnWindows?: boolean;
}): RenderResult => {
  return render(
    <NavigatorHeader clipCount={options.clipCount} onNewAudio={newAudioMock} />,
    {
      selectors: {
        app: {
          getWindowInformation: () => ({
            isOnWindows: options.isOnWindows ?? false,
          }),
        },
      },
    },
  );
};

describe('<NavigatorHeader />', () => {
  afterEach(() => {
    dispatchMock.mockClear();
  });

  it('should render only the title when there are no clips', () => {
    const element = renderSubject({clipCount: 0});
    expect(element.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should render the New button when there are clips in the project', () => {
    const element = renderSubject({clipCount: 1});
    expect(element.queryByRole('button')).toBeInTheDocument();
  });

  it('should show the menu when the New button is clicked', async () => {
    const element = renderSubject({clipCount: 1});
    (await element.findByRole('button')).click();

    await waitFor(() => {
      expect(element.getByText(/audio/i)).toBeInTheDocument();
    });
  });

  it('should show the menu when the keyboard shortcut meta-N is pressed (macOS)', async () => {
    const element = renderSubject({clipCount: 1, isOnWindows: false});
    fireEvent.keyDown(element.baseElement, {key: 'n', metaKey: true});

    await waitFor(() => {
      expect(element.getByText(/audio/i)).toBeInTheDocument();
    });
  });

  it('should show the menu when the keyboard shortcut ctrl-N is pressed (Windows)', async () => {
    const element = renderSubject({clipCount: 1, isOnWindows: true});
    fireEvent.keyDown(element.baseElement, {key: 'n', ctrlKey: true});

    await waitFor(() => {
      expect(element.getByText(/audio/i)).toBeInTheDocument();
    });
  });

  it('should not show the menu when ctrl-N is pressed on macOS', async () => {
    const element = renderSubject({clipCount: 1, isOnWindows: false});
    fireEvent.keyDown(element.baseElement, {key: 'n', ctrlKey: true});

    await waitFor(() => {
      expect(element.queryByText(/audio/i)).not.toBeInTheDocument();
    });
  });

  it('should call the new audio clip action', async () => {
    const element = renderSubject({clipCount: 1});
    (await element.findByRole('button')).click();

    await waitFor(() => {
      expect(element.getByText(/audio/i)).toBeInTheDocument();
    });
    element.getByText(/audio/i).click();
    expect(newAudioMock).toHaveBeenCalled();
  });

  it('should call the new audio clip action via keyboard shortcut', async () => {
    const element = renderSubject({clipCount: 1});
    fireEvent.keyDown(element.baseElement, {key: 'n', metaKey: true});

    await waitFor(() => {
      expect(element.getByText(/audio/i)).toBeInTheDocument();
    });
    fireEvent.keyDown(element.baseElement, {key: 'a'});
    expect(newAudioMock).toHaveBeenCalled();
  });

  it('should call the new clip action', async () => {
    const element = renderSubject({clipCount: 1});
    (await element.findByRole('button')).click();

    await waitFor(() => {
      expect(element.getByText(/draw/i)).toBeInTheDocument();
    });
    element.getByText(/draw/i).click();
    const expectedAction = actions.project.createEmptyClip();
    // The clip id is randomly generated on every call, so we can't compare it
    expectedAction.payload.clipId = expect.any(String);
    expect(dispatchMock).toHaveBeenCalledWith(expectedAction);
  });

  it('should call the new clip action via keyboard shortcut', async () => {
    const element = renderSubject({clipCount: 1});
    fireEvent.keyDown(element.baseElement, {key: 'n', metaKey: true});

    await waitFor(() => {
      expect(element.getByText(/draw/i)).toBeInTheDocument();
    });
    fireEvent.keyDown(element.baseElement, {key: 'd'});
    const expectedAction = actions.project.createEmptyClip();
    // The clip id is randomly generated on every call, so we can't compare it
    expectedAction.payload.clipId = expect.any(String);
    expect(dispatchMock).toHaveBeenCalledWith(expectedAction);
  });
});
