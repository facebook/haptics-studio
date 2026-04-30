/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';
import {clipboard} from 'electron';
import {render, cleanup, act} from '../../test-utils';
import Snackbar from './Snackbar';
import {SnackbarType} from '../../state/types';
import actions from '../../state/actions';
import {SnackbarAutoDismissTime} from '../../globals/constants';

afterEach(cleanup);

const dispatchMock = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => dispatchMock,
}));

describe('<Snackbar />', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    dispatchMock.mockClear();
    jest.useRealTimers();
  });

  it('renders the correct error style', () => {
    const element = render(
      <Snackbar
        text="error"
        type={SnackbarType.Error}
        isDismissable
        autoDismiss
        action={undefined}
      />,
      {},
    );
    expect(element).toMatchSnapshot();
  });

  it('renders the correct success style', () => {
    const element = render(
      <Snackbar
        text="error"
        type={SnackbarType.Success}
        isDismissable
        autoDismiss
        action={undefined}
      />,
      {},
    );
    expect(element).toMatchSnapshot();
  });

  it('renders the correct important style', () => {
    const element = render(
      <Snackbar
        text="error"
        type={SnackbarType.Important}
        isDismissable
        autoDismiss
        action={undefined}
      />,
      {},
    );
    expect(element).toMatchSnapshot();
  });

  it('autodismisses', () => {
    act(() => {
      render(
        <Snackbar
          text="error"
          type={SnackbarType.Success}
          isDismissable
          autoDismiss
          action={undefined}
        />,
        {},
      );
    });
    act(() => {
      jest.advanceTimersByTime(SnackbarAutoDismissTime * 1000 + 100);
    });
    expect(dispatchMock).toHaveBeenCalledWith(actions.app.dismissSnackbar());
  });

  it('can copy error message', () => {
    jest.spyOn(clipboard, 'writeText').mockImplementation();
    const element = render(
      <Snackbar
        text="error message"
        type={SnackbarType.Error}
        isDismissable
        autoDismiss
        action={undefined}
      />,
      {},
    );
    const copyButton = element.getByTestId('copy-button');
    expect(copyButton).toBeInTheDocument();
    copyButton.click();
    expect(clipboard.writeText).toHaveBeenCalledWith('error message');
  });
});
