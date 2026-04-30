/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';

import {render, cleanup, RenderResult} from '../../../test-utils';
import SamplesSection from './SamplesSection';
import {SampleProject} from '../../../state/types';
import actions from '../../../state/actions';

afterEach(cleanup);

const dispatchMock = jest.fn();

jest.mock('electron', () => ({
  shell: {openExternal: jest.fn()},
}));

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => dispatchMock,
}));

const renderSubject = (samples?: SampleProject[]): RenderResult => {
  const defaultSamples: SampleProject[] = [
    {
      name: 'UI Effects',
      projectFile: 'UI_Effects.hasp',
      clipsCount: 5,
    },
    {
      name: 'Impacts',
      projectFile: 'Impacts.hasp',
      clipsCount: 10,
    },
  ];
  return render(<SamplesSection />, {
    selectors: {
      app: {
        getSampleProjects: () => samples ?? defaultSamples,
      },
    },
  });
};

describe('<SamplesSection />', () => {
  afterEach(() => {
    dispatchMock.mockClear();
  });

  it('renders the samples', () => {
    const element = renderSubject();
    expect(element.getAllByTestId('sample-card').length).toBe(2);
  });

  it('filters out tutorial projects', () => {
    const samplesWithTutorial: SampleProject[] = [
      {
        name: 'UI Effects',
        projectFile: 'UI_Effects.hasp',
        clipsCount: 5,
      },
      {
        name: 'Tutorial Project',
        projectFile: '[tutorial] basics.hasp',
        clipsCount: 3,
      },
      {
        name: 'Impacts',
        projectFile: 'Impacts.hasp',
        clipsCount: 10,
      },
    ];
    const element = renderSubject(samplesWithTutorial);
    expect(element.getAllByTestId('sample-card').length).toBe(2);
    expect(element.queryByText('Tutorial Project')).not.toBeInTheDocument();
  });

  it('filters out hidden files with ._ prefix', () => {
    const samplesWithHidden: SampleProject[] = [
      {
        name: 'UI Effects',
        projectFile: 'UI_Effects.hasp',
        clipsCount: 5,
      },
      {
        name: 'Hidden File',
        projectFile: '._hidden.hasp',
        clipsCount: 2,
      },
      {
        name: 'Impacts',
        projectFile: 'Impacts.hasp',
        clipsCount: 10,
      },
    ];
    const element = renderSubject(samplesWithHidden);
    expect(element.getAllByTestId('sample-card').length).toBe(2);
    expect(element.queryByText('Hidden File')).not.toBeInTheDocument();
  });

  it('displays sample names correctly', () => {
    const element = renderSubject();
    expect(element.getByText('UI Effects')).toBeInTheDocument();
    expect(element.getByText('Impacts')).toBeInTheDocument();
  });

  it('dispatches openProject action on sample click', () => {
    const samples: SampleProject[] = [
      {
        name: 'UI Effects',
        projectFile: 'UI_Effects.hasp',
        clipsCount: 5,
      },
    ];
    const element = renderSubject(samples);
    element.getByTestId('sample-card').click();
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.project.openProject({project: samples[0]}),
    );
  });

  it('renders the new badge for new samples', () => {
    const samplesWithNew: SampleProject[] = [
      {
        name: 'UI Effects',
        projectFile: 'UI_Effects.hasp',
        clipsCount: 5,
        new: true,
      },
      {
        name: 'Impacts',
        projectFile: 'Impacts.hasp',
        clipsCount: 10,
      },
    ];
    const element = renderSubject(samplesWithNew);
    const newBadges = element.container.querySelectorAll('.new');
    expect(newBadges.length).toBe(1);
  });

  it('does not render the new badge for non-new samples', () => {
    const element = renderSubject();
    const newBadges = element.container.querySelectorAll('.new');
    expect(newBadges.length).toBe(0);
  });

  it('renders the icon when provided', () => {
    const samplesWithIcon: SampleProject[] = [
      {
        name: 'UI Effects',
        projectFile: 'UI_Effects.hasp',
        clipsCount: 5,
        icon: 'icon-path.png',
      },
    ];
    const element = renderSubject(samplesWithIcon);
    const img = element.container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img?.getAttribute('src')).toBe('media://icon-path.png');
    expect(img?.getAttribute('alt')).toBe('UI Effects');
  });

  it('does not render an icon when not provided', () => {
    const element = renderSubject();
    const imgs = element.container.querySelectorAll('img');
    expect(imgs.length).toBe(0);
  });

  it('displays clips count correctly', () => {
    const element = renderSubject();
    expect(element.container.innerHTML).toContain('5');
    expect(element.container.innerHTML).toContain('10');
  });

  it('handles samples with undefined clipsCount', () => {
    const samplesWithoutCount: SampleProject[] = [
      {
        name: 'UI Effects',
        projectFile: 'UI_Effects.hasp',
      },
    ];
    const element = renderSubject(samplesWithoutCount);
    expect(element.container.innerHTML).toContain('0');
  });

  it('renders the section header', () => {
    const element = renderSubject();
    const header = element.container.querySelector('.title');
    expect(header).toBeInTheDocument();
  });

  it('renders with learning-section testid', () => {
    const element = renderSubject();
    expect(element.getByTestId('learning-section')).toBeInTheDocument();
  });
});
