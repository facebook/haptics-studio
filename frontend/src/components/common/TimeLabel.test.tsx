/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';
import {render, cleanup} from '../../test-utils';
import TimeLabel from './TimeLabel';

afterEach(cleanup);

describe('<TimeLabel />', () => {
  const onCancel = jest.fn();
  const onConfirm = jest.fn();

  it('renders the time label', () => {
    const element = render(
      <TimeLabel time={100} onCancel={onCancel} onConfirm={onConfirm} />,
      {},
    );
    expect(element).toMatchSnapshot();
  });

  it('calls the callbacks', () => {
    const element = render(
      <TimeLabel time={100} onCancel={onCancel} onConfirm={onConfirm} />,
      {},
    );
    element.getByTestId('timelabel-cancel').click();
    expect(onCancel).toHaveBeenCalledTimes(1);

    element.getByTestId('timelabel-confirm').click();
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
