/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';
import userEvent from '@testing-library/user-event';

import {render, cleanup, RenderResult} from '../../../test-utils';
import TrimTool from './TrimTool';
import actions from '../../../state/actions';
import {TrimTimeEditingStep} from '../../../globals/constants';

afterEach(cleanup);

const dispatchMock = jest.fn();
const clipId = 'clip1';

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => dispatchMock,
}));

const renderSubject = (options: {
  duration?: number;
  trimEnabled?: boolean;
  trimTime?: number;
}): RenderResult => {
  const {duration = 0, trimEnabled = false, trimTime = undefined} = options;

  return render(<TrimTool />, {
    selectors: {
      project: {
        getCurrentClipId: () => clipId,
        getCurrentClipOriginalDuration: () => duration,
      },
      editingTools: {
        isTrimmingEnabled: () => trimEnabled,
        getTrimTime: () => trimTime,
      },
    },
  });
};

describe('<TrimTool />', () => {
  beforeEach(() => {
    dispatchMock.mockClear();
  });

  it('should display the initial clip duration as a formatted string', () => {
    const element = renderSubject({duration: 90});
    expect(element.getByText(/1:30/i)).toBeInTheDocument();
  });

  it('should confirm the trim time', () => {
    const element = renderSubject({
      duration: 90,
      trimTime: 30,
      trimEnabled: true,
    });
    element.getByText(/confirm/i).click();
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.editingTools.commitTrim({time: 30}),
    );
  });

  it('should let the user change time', async () => {
    const user = userEvent.setup();

    const element = renderSubject({
      duration: 90,
      trimTime: 30,
      trimEnabled: true,
    });
    element.getByTestId('step-time-up').click();
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.editingTools.setTrimTime({time: 30 + TrimTimeEditingStep}),
    );
    element.getByTestId('step-time-down').click();
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.editingTools.setTrimTime({time: 30 - TrimTimeEditingStep}),
    );
    const input = element.getByRole('textbox') as HTMLInputElement;
    input.focus();
    await user.type(input, '{Backspace}{Backspace}{Backspace}');
    await user.type(input, '5');
    await user.type(input, '{Enter}');
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.editingTools.setTrimTime({time: 30.5}),
    );
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.editingTools.commitTrim({time: 30.5}),
    );
  });

  it('should cancel the trim operation with Esc', async () => {
    renderSubject({duration: 90, trimTime: 30, trimEnabled: true});
    await userEvent.keyboard('{Escape}');
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.editingTools.cancelTrim(),
    );
  });
});
