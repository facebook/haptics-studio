/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';
import {render, cleanup} from '../../test-utils';
import Banner, {BannerSize} from './Banner';

afterEach(cleanup);

describe('<Banner />', () => {
  it('renders the banner components', () => {
    const element = render(
      <Banner
        visible
        title="Banner title"
        subtitle="Banner subtitle"
        size={BannerSize.Small}
      />,
      {},
    );
    expect(element).toMatchSnapshot();
    expect(element.getByText('Banner title')).toBeInTheDocument();
    expect(element.getByText('Banner subtitle')).toBeInTheDocument();
  });

  it('renders the optional image component', () => {
    const element = render(
      <Banner
        visible
        title="Banner title"
        subtitle="Banner subtitle"
        image="image/path"
        size={BannerSize.Small}
      />,
      {},
    );
    expect(element).toMatchSnapshot();
  });

  it('calls the callback action when the CTA is pressed', () => {
    const action = jest.fn();
    const element = render(
      <Banner
        visible
        title="Banner title"
        subtitle="Banner subtitle"
        actions={[
          {
            label: 'Click here',
            onClick: () => {
              action();
            },
          },
        ]}
      />,
      {},
    );
    element.getByText('Click here').click();
    expect(action).toHaveBeenCalled();
  });

  it('can optionally be dismissed', () => {
    const action = jest.fn();
    const element = render(
      <Banner
        visible
        title="Banner title"
        subtitle="Banner subtitle"
        onDismiss={() => {
          action();
        }}
      />,
      {},
    );
    element.getByTestId('close-button').click();
    expect(action).toHaveBeenCalled();
  });
});
