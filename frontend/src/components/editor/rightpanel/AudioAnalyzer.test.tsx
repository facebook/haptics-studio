/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';
import userEvent from '@testing-library/user-event';

import {render, cleanup, RenderResult} from '../../../test-utils';
import actions from '../../../state/actions';
import AudioAnalyzer from './AudioAnalyzer';
import clipMock from '../../../__mocks__/clipMock';

afterEach(cleanup);

const dispatchMock = jest.fn();
const clipId = 'clip1';

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('lodash', () => ({
  ...jest.requireActual('lodash'),
  debounce: (fn: () => void) => fn,
}));

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => dispatchMock,
}));

const renderSubject = (options: {selectedClips?: string[]}): RenderResult => {
  const clip = clipMock({});
  const {selectedClips = [clipId]} = options;

  return render(<AudioAnalyzer />, {
    selectors: {
      project: {
        getCurrentClip: () => clip,
        getCurrentClipId: () => clipId,
        getSelectedClipsWithAudio: () => selectedClips,
      },
    },
  });
};

describe('<AudioAnalyzer />', () => {
  beforeEach(() => {
    dispatchMock.mockClear();
  });

  describe('when multiple audio-based clips are selected', () => {
    it('should show the batch UI', () => {
      const subject = renderSubject({selectedClips: ['clip1', 'clip2']});
      expect(subject.getByText(/batch/i)).toBeInTheDocument();
    });

    it('should ask the user confirmation when multiple clips are selected', async () => {
      const user = userEvent.setup();

      const subject = renderSubject({selectedClips: ['clip1', 'clip2']});
      const sliders = subject.queryAllByRole('slider');
      const frequencySlider = sliders[sliders.length - 1];
      frequencySlider.focus();
      await user.type(frequencySlider, '{ArrowLeft}');

      const action = actions.project.batchAudioAnalysis({
        clipIds: ['clip1', 'clip2'],
        settingsChange: {
          output_max: expect.anything(),
          output_min: expect.anything(),
        },
        group: 'frequency',
      });

      expect(dispatchMock).toHaveBeenCalledWith(
        actions.app.showDialog({
          title: expect.anything(),
          text: expect.anything(),
          confirmButton: expect.anything(),
          action,
        }),
      );
    });
  });
});
