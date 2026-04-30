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
import NavigatorGroup from './NavigatorGroup';
import actions from '../../../state/actions';
import {ClipGroup, FocusArea} from '../../../state/types';

afterEach(cleanup);

const dispatchMock = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => dispatchMock,
}));

const renderSubject = (): RenderResult => {
  const group = {
    id: 'group1',
    name: 'Group Name',
    clips: ['clip1'],
    isFolder: true,
  } as ClipGroup;
  return render(
    <NavigatorGroup
      group={group}
      isSelected={false}
      isDragging={false}
      isOpen={false}
    />,
    {
      selectors: {
        app: {
          getFocus: () => FocusArea.Navigator,
        },
      },
    },
  );
};

describe('<NavigatorGroup />', () => {
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
    await user.keyboard('{Shift>}');
    await user.click(element.getByText('Group Name'));
    await user.keyboard('{/Shift}');
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.project.selectGroup({id: 'group1', add: false, range: true}),
    );
    await user.keyboard('{Meta>}');
    await user.click(element.getByText('Group Name'));
    await user.keyboard('{/Meta}');
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.project.selectGroup({id: 'group1', add: false, range: true}),
    );
  });

  it('should handle the group name editing', async () => {
    const user = userEvent.setup();
    const element = renderSubject();
    fireEvent.dblClick(element.getByText('Group Name'));
    const textbox = element.getByRole('textbox');
    expect(textbox).toBeInTheDocument();
    await user.keyboard(`{Backspace>${'Group Name'.length}/}`);
    await user.type(textbox, 'New name');
    await user.keyboard('{Enter}');
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.project.renameClipGroup({id: 'group1', name: 'New name'}),
    );

    dispatchMock.mockClear();
    fireEvent.dblClick(element.getByText('Group Name'));
    await user.keyboard('{Escape}');
    expect(dispatchMock).not.toHaveBeenCalledWith(
      actions.project.renameClipGroup(expect.anything()),
    );

    fireEvent.dblClick(element.getByText('Group Name'));
    await user.keyboard('{Enter}');
    expect(dispatchMock).not.toHaveBeenCalledWith(
      actions.project.renameClipGroup(expect.anything()),
    );
  });
});
