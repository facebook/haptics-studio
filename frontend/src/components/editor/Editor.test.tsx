/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';

import {render, cleanup, RenderResult, fireEvent} from '../../test-utils';
import Editor from './Editor';
import actions from '../../state/actions';
import {EnvelopeType, FocusArea} from '../../../src/state/types';

import clipMock from '../../__mocks__/clipMock';
import {editorDataFromHaptic} from '../../globals/utils';

afterEach(cleanup);

const dispatchMock = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => dispatchMock,
}));

const clip = clipMock({});

const renderSubject = (options: {focus?: FocusArea}): RenderResult => {
  const {focus = FocusArea.Plot} = options;
  const clipboard = {amplitude: [], frequency: []};
  return render(<Editor className="" />, {
    selectors: {
      app: {
        getVisibility: () => ({audio: true, envelope: EnvelopeType.Amplitude}),
        getFocus: () => focus,
        getClipboard: () => clipboard,
        getSidePanelWidth: () => 300,
      },
      project: {
        getCurrentClip: () => clip,
        getCurrentClipId: () => undefined,
        getClipsCount: () => 1,
        hasCurrentClipUndos: () => false,
        hasCurrentClipRedos: () => false,
        getCurrentClipLoading: () => false,
      },
    },
  });
};

describe('<Editor />', () => {
  beforeEach(() => {
    dispatchMock.mockClear();
  });

  describe('editor area', () => {
    it('sets the current frame state on mount', () => {
      renderSubject({});
      const {amplitude, frequency} = editorDataFromHaptic(
        clip.state.present.haptic,
      );
      expect(dispatchMock).toHaveBeenCalledWith(
        actions.frame.set(
          amplitude,
          frequency,
          {startTime: 0, endTime: 1, duration: 1, samples: 0},
          [],
        ),
      );
    });

    it('sets focus on the editor on click', () => {
      const element = renderSubject({focus: FocusArea.Navigator}).getByTestId(
        'editor',
      );
      dispatchMock.mockClear();
      fireEvent.click(element);
      expect(dispatchMock).toHaveBeenCalledWith(
        actions.app.setFocusArea({focus: FocusArea.Plot}),
      );
    });
  });
});
