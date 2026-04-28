/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';

import {render, cleanup, RenderResult} from '../../test-utils';
import actions from '../../state/actions';
import GuidanceOverlay from './GuidanceOverlay';

afterEach(cleanup);

const dispatchMock = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => dispatchMock,
}));

const renderSubject = (): RenderResult => {
  return render(<GuidanceOverlay />, {
    selectors: {
      app: {
        isOnWindows: () => false,
      },
    },
  });
};

describe('<GuidanceOverlay />', () => {
  beforeEach(() => {
    dispatchMock.mockClear();
  });

  it('handles the creation of a new empty clip', () => {
    const element = renderSubject();
    element.getByTestId('create-audio').click();
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.project.requestAddFiles({properties: undefined}),
    );
  });

  it('handles the creation of a new empty clip via pen', () => {
    const element = renderSubject();
    element.getByTestId('create-pen').click();
    const action = actions.project.createEmptyClip();
    action.payload.clipId = expect.anything();
    expect(dispatchMock).toHaveBeenCalledWith(action);
  });
});
