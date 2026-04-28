/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';

import {render, cleanup, RenderResult, fireEvent} from '../../../test-utils';
import RightPanel from './RightPanel';
import actions from '../../../state/actions';
import clipMock from '../../../__mocks__/clipMock';
import {FocusArea, RightPanelSection} from '../../../../src/state/types';

afterEach(cleanup);

const dispatchMock = jest.fn();
const clipId = 'clip1';

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => dispatchMock,
}));

const renderSubject = (options: {
  currentClipId: string | undefined;
  fromAudio?: boolean;
  selectedPoints?: number[];
  isAuthoringTutorial?: boolean;
  clipIds?: number[];
  activeItem?: RightPanelSection;
}): RenderResult => {
  const {
    currentClipId,
    fromAudio = true,
    selectedPoints = [],
    isAuthoringTutorial = false,
    clipIds = [clipId],
    activeItem = RightPanelSection.Analysis,
  } = options;

  const mockClip = clipMock({selectedPoints, fromAudio});

  return render(<RightPanel />, {
    selectors: {
      project: {
        getProjectInfo: () => ({isAuthoringTutorial}),
        getClipIds: () => clipIds,
        getCurrentClip: () => (currentClipId ? mockClip : undefined),
        getCurrentClipId: () => currentClipId,
      },
      app: {
        getDefaultControlStatus: () => true,
        getFocus: () => FocusArea.RightPanel,
        getSidePanelWidth: () => 300,
        getRightPanelItem: () => activeItem,
      },
    },
  });
};

describe('<RightPanel />', () => {
  beforeEach(() => {
    dispatchMock.mockClear();
  });

  it('should default to the Design tab when the clip has an audio', () => {
    renderSubject({currentClipId: clipId});
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.app.setRightPanelItem({item: RightPanelSection.Analysis}),
    );
  });

  it('should default to the Clip tab when the clip has no audio', () => {
    renderSubject({currentClipId: clipId, fromAudio: false});
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.app.setRightPanelItem({item: RightPanelSection.Design}),
    );
  });

  it('should show the trim and audio widgets when a clip is selected', () => {
    const element = renderSubject({
      currentClipId: clipId,
      fromAudio: false,
      activeItem: RightPanelSection.Design,
    });
    expect(element.queryByTestId('clip-trim-widget')).toBeVisible();
    expect(element.queryByTestId('audio-file-widget')).toBeVisible();
  });

  it('should not show the trim and audio widgets if there is no selected clip', () => {
    const element = renderSubject({
      currentClipId: undefined,
      activeItem: RightPanelSection.Design,
    });
    expect(element.queryByTestId('clip-trim-widget')).toBeNull();
    expect(element.queryByTestId('audio-file-widget')).toBeNull();
  });

  describe('keyboard shortcuts', () => {
    it('should not switch to the Design tab if the clip has no audio', () => {
      renderSubject({currentClipId: clipId, fromAudio: false});
      fireEvent.keyDown(window, {key: 'd', code: 'KeyD', ctrlKey: true});
      expect(dispatchMock).not.toHaveBeenCalledWith(
        actions.app.setRightPanelItem({item: RightPanelSection.Analysis}),
      );
    });
  });
});
