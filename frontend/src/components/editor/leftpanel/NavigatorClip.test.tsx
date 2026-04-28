/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';
import userEvent from '@testing-library/user-event';

import {render, cleanup, RenderResult, fireEvent} from '../../../test-utils';
import NavigatorClip from './NavigatorClip';
import actions from '../../../state/actions';
import {FocusArea} from '../../../state/types';
import baseClipState from '../../../__mocks__/clipMock';

afterEach(cleanup);

const dispatchMock = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => dispatchMock,
}));

const renderSubject = (): RenderResult => {
  const clip = baseClipState({name: 'Sound effect'});
  return render(
    <NavigatorClip clip={clip} clipId="clip1" groupId="groupId" />,
    {
      selectors: {
        project: {
          getSelection: () => ({
            clips: [],
            lastSelected: 'clip1',
            groups: [],
          }),
        },
        app: {
          getFocus: () => FocusArea.Navigator,
        },
      },
    },
  );
};

describe('<NavigatorClip />', () => {
  afterEach(() => {
    dispatchMock.mockClear();
  });

  it('renders the main component', () => {
    const element = renderSubject();
    expect(element).toMatchSnapshot();
  });

  it('should handle the selection on click', async () => {
    const user = userEvent.setup();
    const element = renderSubject();
    await user.click(element.getByText('Sound effect'));
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.project.setCurrentClip({id: 'clip1'}),
    );
    await user.keyboard('{Shift>}');
    await user.click(element.getByText('Sound effect'));
    await user.keyboard('{/Shift}');
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.project.selectClip({id: 'clip1', add: false, range: true}),
    );
    await user.keyboard('{Meta>}');
    await user.click(element.getByText('Sound effect'));
    await user.keyboard('{/Meta}');
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.project.selectClip({id: 'clip1', add: true, range: false}),
    );
  });

  it('should handle the clip name editing', async () => {
    const user = userEvent.setup();
    const element = renderSubject();
    fireEvent.dblClick(element.getByText('Sound effect'));
    const textbox = element.getByRole('textbox');
    expect(textbox).toBeInTheDocument();
    await user.keyboard(`{Backspace>${'Sound effect'.length}/}`);
    await user.type(textbox, 'New name');
    await user.keyboard('{Enter}');
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.project.renameClip({clipId: 'clip1', name: 'New name'}),
    );

    dispatchMock.mockClear();
    fireEvent.dblClick(element.getByText('Sound effect'));
    await user.keyboard('{Escape}');
    expect(dispatchMock).not.toHaveBeenCalledWith(
      actions.project.renameClip(expect.anything()),
    );

    fireEvent.dblClick(element.getByText('Sound effect'));
    await user.keyboard('{Enter}');
    expect(dispatchMock).not.toHaveBeenCalledWith(
      actions.project.renameClip(expect.anything()),
    );
  });
});
