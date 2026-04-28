/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';
import {render, cleanup} from '../../test-utils';
import ToggleSwitch from './ToggleSwitch';

afterEach(cleanup);

describe('<ToggleSwitch />', () => {
  it('renders the component as checked', () => {
    const element = render(
      <ToggleSwitch checked onChange={() => {}}>
        <div />
      </ToggleSwitch>,
      {},
    );
    expect(element).toMatchSnapshot();
  });

  it('renders the component as unchecked', () => {
    const element = render(
      <ToggleSwitch checked={false} onChange={() => {}}>
        <div />
      </ToggleSwitch>,
      {},
    );
    expect(element).toMatchSnapshot();
  });

  it('calls the onChange callback', () => {
    const action = jest.fn();
    const element = render(
      <ToggleSwitch
        checked
        onChange={() => {
          action();
        }}>
        <div />
      </ToggleSwitch>,
      {},
    );
    element.getByRole('button').click();
    expect(action).toHaveBeenCalled();
  });
});
