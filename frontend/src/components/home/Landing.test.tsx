/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';
import {ipcRenderer} from 'electron';
import {render, cleanup, RenderResult, waitFor} from '../../test-utils';
import Landing from './Landing';
import {LandingPageSection} from '../../state/types';

// Mock react-dropzone
jest.mock('react-dropzone', () => ({
  useDropzone: () => ({
    getRootProps: () => ({}),
    getInputProps: () => ({}),
  }),
}));

afterEach(cleanup);

const mockLocalStorage: {[key: string]: string} = {};

beforeEach(() => {
  jest
    .spyOn(ipcRenderer, 'invoke')
    .mockImplementation(async (channel: string) => {
      if (channel === 'recent_projects') {
        return {status: 'ok', payload: {projects: []}};
      }
      if (channel === 'samples') {
        return {status: 'ok', payload: {samples: []}};
      }
      return {status: 'ok', payload: {}};
    });

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
  jest.clearAllMocks();
});

const renderSubject = (
  version = '2.2.0',
  currentSection = LandingPageSection.Projects,
): RenderResult => {
  return render(<Landing />, {
    selectors: {
      app: {
        getWindowInformation: () => ({version}),
        getLandingPageSection: () => currentSection,
        getTelemetryState: () => ({
          shouldShowTelemetryNotification: false,
        }),
      },
    },
  });
};

describe('<Landing /> - New Badge Logic', () => {
  describe('showNewSamples', () => {
    it('shows "new" badge when user has never opened samples (null value)', () => {
      const element = renderSubject('2.2.0');
      const samplesTab = element
        .getByText(/sample projects/i)
        .closest('[role="menuitem"]');
      expect(samplesTab?.classList.contains('new')).toBe(true);
    });

    it('shows "new" badge when stored version is older than sinceVersion', () => {
      mockLocalStorage['samples-new'] = '2.1.0';
      const element = renderSubject('2.2.0');
      const samplesTab = element
        .getByText(/sample projects/i)
        .closest('[role="menuitem"]');
      expect(samplesTab?.classList.contains('new')).toBe(true);
    });

    it('does not show "new" badge when stored version equals sinceVersion', () => {
      mockLocalStorage['samples-new'] = '2.2.0';
      const element = renderSubject('2.2.0');
      const samplesTab = element
        .getByText(/sample projects/i)
        .closest('[role="menuitem"]');
      expect(samplesTab?.classList.contains('new')).toBe(false);
    });

    it('does not show "new" badge when stored version is newer than sinceVersion', () => {
      mockLocalStorage['samples-new'] = '2.3.0';
      const element = renderSubject('2.2.0');
      const samplesTab = element
        .getByText(/sample projects/i)
        .closest('[role="menuitem"]');
      expect(samplesTab?.classList.contains('new')).toBe(false);
    });

    it('does not show "new" badge when version is empty', () => {
      const element = renderSubject('');
      const samplesText = element.queryByText(/sample projects/i);
      if (samplesText) {
        const samplesTab = samplesText.closest('[role="menuitem"]');
        expect(samplesTab?.classList.contains('new')).toBe(false);
      }
    });
  });

  describe('showNewTutorials', () => {
    it('does not show "new" badge for tutorials when showNew is false', () => {
      const element = renderSubject('2.0.0');
      const learningTab = element
        .getByText('Learning')
        .closest('[role="menuitem"]');
      expect(learningTab?.classList.contains('new')).toBe(false);
    });

    it('respects the showNew flag even with null stored value', () => {
      const element = renderSubject('2.1.0');
      const learningTab = element
        .getByText('Learning')
        .closest('[role="menuitem"]');
      expect(learningTab?.classList.contains('new')).toBe(false);
    });

    it('respects the showNew flag even with old stored version', () => {
      mockLocalStorage['tutorials-new'] = '1.9.0';
      const element = renderSubject('2.0.0');
      const learningTab = element
        .getByText('Learning')
        .closest('[role="menuitem"]');
      expect(learningTab?.classList.contains('new')).toBe(false);
    });
  });

  describe('Badge dismissal on section click', () => {
    it('stores version when samples section is clicked', async () => {
      renderSubject('2.2.0', LandingPageSection.Samples);
      await waitFor(() => {
        expect(mockLocalStorage['samples-new']).toBe('2.2.0');
      });
    });

    it('stores version when learning section is clicked', async () => {
      renderSubject('2.0.0', LandingPageSection.Learning);
      await waitFor(() => {
        expect(mockLocalStorage['tutorials-new']).toBe('2.0.0');
      });
    });

    it('does not store version when projects section is active', async () => {
      renderSubject('2.2.0', LandingPageSection.Projects);
      await waitFor(() => {
        expect(mockLocalStorage['samples-new']).toBeUndefined();
        expect(mockLocalStorage['tutorials-new']).toBeUndefined();
      });
    });
  });
});
