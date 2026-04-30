/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';
import {render, cleanup} from '../../../../test-utils';
import ResourceCard, {Resource} from './ResourceCard';

afterEach(cleanup);

describe('<ResourceCard />', () => {
  it('renders the resource', () => {
    const resource: Resource = {
      category: 'GITHUB',
      title: 'Learning Resources and Example Projects',
      description:
        'Deep dive into our example projects and learning resources in our GitHub repository.',
      image: 'learning-github.png',
      url: 'https://github.com/oculus-samples/haptics-studio-examples/',
    };
    const element = render(<ResourceCard resource={resource} />, {});
    expect(element.queryByText('NEW')).toBeNull();
    expect(
      element.getByText(resource.category.toLowerCase()),
    ).toBeInTheDocument();
    expect(element.getByText(resource.title)).toBeInTheDocument();
    expect(element.getByText(resource.description)).toBeInTheDocument();
  });

  it('renders the NEW tag', () => {
    const resource: Resource = {
      new: true,
      category: 'GITHUB',
      title: 'Learning Resources and Example Projects',
      description:
        'Deep dive into our example projects and learning resources in our GitHub repository.',
      image: 'learning-github.png',
      url: 'https://github.com/oculus-samples/haptics-studio-examples/',
    };
    const element = render(<ResourceCard resource={resource} />, {});
    expect(element.getByText('NEW')).toBeInTheDocument();
  });
});
