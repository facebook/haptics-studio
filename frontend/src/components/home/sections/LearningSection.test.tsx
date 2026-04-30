/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';
import {shell} from 'electron';
import {render, cleanup, RenderResult} from '../../../test-utils';
import LearningSection from './LearningSection';
import {SampleProject} from '../../../state/types';

import resources from '../../../globals/ExternalResources.json';

afterEach(cleanup);

jest.mock('electron', () => ({
  shell: {openExternal: jest.fn()},
}));

const renderSubject = (): RenderResult => {
  const tutorials: SampleProject[] = [
    {
      name: 'Advanced tutorial',
      projectFile: '[tutorial] advanced.hasp',
      slug: 'advanced-design',
    },
    {
      name: 'Basics tutorial',
      projectFile: '[tutorial] basics.hasp',
      slug: 'basics-of-haptic-design',
    },
  ];
  return render(<LearningSection />, {
    selectors: {
      app: {
        getSampleProjects: () => tutorials,
      },
    },
  });
};

describe('<LearningSection />', () => {
  it('renders the tutorials', () => {
    const element = renderSubject();
    expect(element.getAllByTestId('tutorial-card').length).toBe(2);
  });

  it('renders the basics tutorial first', () => {
    const element = renderSubject();
    expect(element.getAllByTestId('tutorial-card')[0].innerHTML).toContain(
      'Basics tutorial',
    );
  });

  it('renders all external links', () => {
    const element = renderSubject();
    expect(element.getAllByTestId('resource-card').length).toBe(5);
  });

  it('redirects to the external link on click', () => {
    const element = renderSubject();
    element.getAllByTestId('resource-card')[0].click();
    expect(shell.openExternal).toHaveBeenCalledWith(resources[0].url);
  });
});
