/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';

import {render, cleanup, RenderResult} from '../../../test-utils';
import DetailEditing from './DetailEditing';
import actions from '../../../state/actions';
import clipMock, {frameState} from '../../../__mocks__/clipMock';
import {EnvelopeType, FocusArea} from '../../../../src/state/types';
import {DetailEditingStep} from '../../../globals/constants';

afterEach(cleanup);

const dispatchMock = jest.fn();
const clipId = 'clip1';

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => dispatchMock,
}));

const renderWithSelection = (
  selectedPoints: number[],
  envelope: EnvelopeType = EnvelopeType.Amplitude,
): RenderResult => {
  const mockWithSelection = clipMock({selectedPoints});

  return render(<DetailEditing />, {
    selectors: {
      project: {
        getCurrentClip: () => mockWithSelection,
        getCurrentClipId: () => clipId,
      },
      app: {
        getFocus: () => FocusArea.RightPanel,
        getVisibility: () => ({audio: true, envelope}),
      },
      frame: {
        getCurrentFrame: () => frameState,
      },
    },
  });
};

describe('<DetailEditing />', () => {
  beforeEach(() => {
    dispatchMock.mockClear();
  });

  it('should display the breakpoint value', () => {
    const subject = renderWithSelection([0]);
    expect(
      subject.getByDisplayValue(frameState[0].y.toFixed(2)),
    ).toBeInTheDocument();
    expect(subject.queryAllByText('emphasis').length).toBe(0);
  });

  it('should display the emphasis value when a point has a transient', () => {
    const subject = renderWithSelection([1]);
    expect(subject.getByText(/Emphasis/)).toBeInTheDocument();
  });

  it('should allow to step the amplitude up', () => {
    const subject = renderWithSelection([0]);
    subject.getByTestId('step-value-up').click();
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.project.editSelectionValue({
        clipId,
        envelope: EnvelopeType.Amplitude,
        value: frameState[0].y + DetailEditingStep,
      }),
    );
  });

  it('should allow to step the amplitude down', () => {
    const subject = renderWithSelection([0]);
    subject.getByTestId('step-value-down').click();
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.project.editSelectionValue({
        clipId,
        envelope: EnvelopeType.Amplitude,
        value: frameState[0].y - DetailEditingStep,
      }),
    );
  });

  it('should render the frequency value when the frequency envelope is selected', () => {
    const subject = renderWithSelection([0], EnvelopeType.Frequency);
    expect(subject.getByText(/Frequency/)).toBeInTheDocument();
  });
});
