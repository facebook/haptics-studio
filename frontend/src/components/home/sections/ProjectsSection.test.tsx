/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';
import {render, cleanup, RenderResult, fireEvent} from '../../../test-utils';
import ProjectsSection from './ProjectsSection';
import {LandingPageSection, RecentProject} from '../../../state/types';
import actions from '../../../state/actions';

afterEach(cleanup);

const dispatchMock = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => dispatchMock,
}));

const mockLocalStorage: {[key: string]: string} = {};

beforeEach(() => {
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn((key: string) => mockLocalStorage[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete mockLocalStorage[key];
      }),
      clear: jest.fn(() => {
        Object.keys(mockLocalStorage).forEach(key => {
          delete mockLocalStorage[key];
        });
      }),
    },
    writable: true,
  });
});

afterEach(() => {
  Object.keys(mockLocalStorage).forEach(key => {
    delete mockLocalStorage[key];
  });
  dispatchMock.mockClear();
});

const defaultRecentProjects: RecentProject[] = [
  {
    name: 'My Project',
    projectFile: '/path/to/project.hasp',
    updatedAt: Date.now() - 60000,
    clipsCount: 3,
  },
  {
    name: 'Another Project',
    projectFile: '/path/to/another.hasp',
    updatedAt: Date.now() - 120000,
    clipsCount: 7,
  },
];

const renderSubject = (
  recentProjects: RecentProject[] = defaultRecentProjects,
): RenderResult => {
  return render(<ProjectsSection />, {
    selectors: {
      app: {
        getRecentProjects: () => recentProjects,
      },
    },
  });
};

describe('<ProjectsSection />', () => {
  describe('Get Started banner', () => {
    it('renders the banner when localStorage has no dismissed value', () => {
      const element = renderSubject();
      expect(element.getByText('Get Started')).toBeInTheDocument();
      expect(element.getByText('LEARN')).toBeInTheDocument();
      expect(
        element.getByText('New to Haptics? Start here'),
      ).toBeInTheDocument();
      expect(
        element.getByText(
          /Explore our Learning Section for interactive tutorials/,
        ),
      ).toBeInTheDocument();
    });

    it('does not render the banner when it was previously dismissed', () => {
      mockLocalStorage['getting-started-banner-dismissed'] = 'true';
      const element = renderSubject();
      expect(element.queryByText('Get Started')).not.toBeInTheDocument();
      expect(element.queryByText('LEARN')).not.toBeInTheDocument();
    });

    it('hides the banner when the close button is clicked', () => {
      const element = renderSubject();
      expect(element.getByText('LEARN')).toBeInTheDocument();

      const closeButton = element.getByTestId('close-button');
      fireEvent.click(closeButton);

      expect(element.queryByText('LEARN')).not.toBeInTheDocument();
      expect(element.queryByText('Get Started')).not.toBeInTheDocument();
    });

    it('persists the dismissed state to localStorage', () => {
      const element = renderSubject();
      const closeButton = element.getByTestId('close-button');
      fireEvent.click(closeButton);

      expect(mockLocalStorage['getting-started-banner-dismissed']).toBe('true');
    });

    it('dispatches setLandingPageSection to Learning when the banner is clicked', () => {
      const element = renderSubject();
      const bannerTag = element.getByText('LEARN');
      const banner = bannerTag.closest('[class*="banner"]')!;
      fireEvent.click(banner);

      expect(dispatchMock).toHaveBeenCalledWith(
        actions.app.setLandingPageSection({
          section: LandingPageSection.Learning,
        }),
      );
    });

    it('does not navigate to Learning when the close button is clicked', () => {
      const element = renderSubject();
      const closeButton = element.getByTestId('close-button');
      fireEvent.click(closeButton);

      const setLandingCalls = dispatchMock.mock.calls.filter(
        ([action]: [ReturnType<typeof actions.app.setLandingPageSection>]) =>
          action.type === actions.app.setLandingPageSection.type,
      );
      expect(setLandingCalls).toHaveLength(0);
    });
  });

  describe('Recent projects', () => {
    it('renders the projects list with recent projects', () => {
      const element = renderSubject();
      expect(element.getByText('My Project')).toBeInTheDocument();
      expect(element.getByText('Another Project')).toBeInTheDocument();
    });

    it('shows empty state when there are no recent projects', () => {
      const element = renderSubject([]);
      expect(element.getByText('Nothing here yet')).toBeInTheDocument();
    });

    it('dispatches openProject when a recent project is clicked', () => {
      const element = renderSubject();
      fireEvent.click(element.getByText('My Project'));

      expect(dispatchMock).toHaveBeenCalledWith(
        actions.project.openProject({project: defaultRecentProjects[0]}),
      );
    });

    it('always renders the projects header regardless of banner state', () => {
      mockLocalStorage['getting-started-banner-dismissed'] = 'true';
      const element = renderSubject();
      expect(element.getByText('Projects')).toBeInTheDocument();
    });

    it('displays clips count for projects that have it', () => {
      const element = renderSubject();
      expect(element.container.innerHTML).toContain('3');
      expect(element.container.innerHTML).toContain('7');
    });
  });

  describe('Open project button', () => {
    it('dispatches openProjectFromBrowser when clicked', () => {
      const element = renderSubject();
      const openButton = element.getByText('Open Recent');
      fireEvent.click(openButton);

      expect(dispatchMock).toHaveBeenCalledWith(
        actions.app.openProjectFromBrowser(),
      );
    });
  });

  describe('fetchRecents', () => {
    it('dispatches fetchRecents on mount', () => {
      renderSubject();
      expect(dispatchMock).toHaveBeenCalledWith(actions.app.fetchRecents());
    });
  });
});
