/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';
import {render, cleanup} from '../../test-utils';
import DropdownMenu from './DropdownMenu';

afterEach(cleanup);

const items = [
  {
    label: 'Item 1',
    onClick: jest.fn(),
  },
  {
    label: 'Item 2',
    onClick: jest.fn(),
  },
];

describe('<DropdownMenu />', () => {
  it('renders the menu items', () => {
    const element = render(
      <DropdownMenu items={items}>
        <button type="button">Click me</button>
      </DropdownMenu>,
      {},
    );
    element.getByRole('button').click();
    expect(element.getByText('Item 1')).toBeInTheDocument();
    expect(element.getByText('Item 2')).toBeInTheDocument();
  });

  it('calls the action callback on click', () => {
    const element = render(
      <DropdownMenu items={items}>
        <button type="button">Click me</button>
      </DropdownMenu>,
      {},
    );
    element.getByRole('button').click();
    const menuItem = element.getByText('Item 1');
    menuItem.click();
    expect(items[0].onClick).toHaveBeenCalled();
  });
});
