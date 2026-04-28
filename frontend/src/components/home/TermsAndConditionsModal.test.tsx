/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';
import {render, cleanup} from '../../test-utils';
import TermsAndConditionsModal from './TermsAndConditionsModal';
import actions from '../../state/actions';

afterEach(cleanup);

const dispatchMock = jest.fn();

// Mock HTMLMediaElement to prevent video autoplay warnings during tests
beforeAll(() => {
  const mockAddEventListener = jest.fn();
  const mockRemoveEventListener = jest.fn();

  window.HTMLMediaElement.prototype.addEventListener = mockAddEventListener;
  window.HTMLMediaElement.prototype.removeEventListener =
    mockRemoveEventListener;

  window.HTMLMediaElement.prototype.load = jest.fn();
  window.HTMLMediaElement.prototype.play = jest.fn(() => Promise.resolve());
  window.HTMLMediaElement.prototype.pause = jest.fn();

  Object.defineProperty(window.HTMLMediaElement.prototype, 'muted', {
    writable: true,
    value: true,
  });

  Object.defineProperty(window.HTMLMediaElement.prototype, 'autoplay', {
    writable: true,
    value: false,
  });
});

jest.mock('electron', () => ({
  shell: {
    openExternal: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => dispatchMock,
}));

describe('<TermsAndConditionsModal />', () => {
  it('Can accept the terms', () => {
    const element = render(<TermsAndConditionsModal />, {});
    expect(element.getByText('I Accept')).toBeInTheDocument();
    element.getByText('I Accept').click();
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.app.updateTermsAndConditionsApprove({termsAccepted: true}),
    );
  });

  it('Can reject the terms', () => {
    const element = render(<TermsAndConditionsModal />, {});
    expect(element.getByText('Reject')).toBeInTheDocument();
    element.getByText('Reject').click();
    expect(dispatchMock).toHaveBeenCalledWith(actions.app.quitApplication());
  });
});
