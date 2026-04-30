/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';
import {render, cleanup} from '../../test-utils';
import Spinner from './Spinner';

afterEach(cleanup);

describe('<Spinner />', () => {
  it('renders the basic spinner components', () => {
    const element = render(<Spinner />, {});
    expect(element).toMatchSnapshot();
  });

  it('renders the absolute spinner components', () => {
    const element = render(<Spinner absolute />, {});
    expect(element).toMatchSnapshot();
  });

  it('renders the props overrides', () => {
    const element = render(<Spinner size={42} margin={20} color="black" />, {});
    expect(element).toMatchSnapshot();
  });
});
