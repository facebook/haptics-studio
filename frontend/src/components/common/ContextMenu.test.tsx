/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';
import {render, cleanup, RenderResult} from '../../test-utils';
import ContextMenu from './ContextMenu';
import clipMock from '../../__mocks__/clipMock';
import actions from '../../state/actions';

afterEach(cleanup);

const clipIds = ['clip1'];

const dispatchMock = jest.fn();
const canGroupMock = jest.fn();
const canUngroupMock = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => dispatchMock,
}));

const renderSubject = (options: {
  withAudio?: boolean;
  isSample?: boolean;
  channels?: number;
}): RenderResult => {
  const {isSample = false, channels = 2} = options;

  const clip1 = clipMock({
    audioExists: options.withAudio ?? true,
    channels,
  });

  return render(<ContextMenu position={{x: 0, y: 0}} />, {
    selectors: {
      project: {
        getCurrentClipId: () => clipIds[0],
        getCurrentClip: () => clip1,
        getSelectedClips: () => ['clip1'],
        canGroupClips: canGroupMock,
        canUngroupClips: canUngroupMock,
        getProjectInfo: () => ({isSample}),
      },
      app: {
        getWindowInformation: () => ({size: [1920, 1080]}),
        isOnWindows: () => false,
      },
    },
  });
};

describe('<ContextMenu />', () => {
  afterEach(() => {
    dispatchMock.mockClear();
  });

  it('renders the menu items', () => {
    const subject = renderSubject({withAudio: true});
    expect(subject.getByText(/^group/i)).toBeInTheDocument();
    expect(subject.getByText(/ungroup/i)).toBeInTheDocument();
    expect(subject.getByText(/duplicate/i)).toBeInTheDocument();
    expect(subject.getByText(/remove/i)).toBeInTheDocument();
    expect(subject.getByText(/split/i)).toBeInTheDocument();
  });

  it('should hide the stereo split when the project is a sample', () => {
    const subject = renderSubject({withAudio: true, isSample: true});
    expect(subject.queryByText(/^split/i)).not.toBeInTheDocument();
  });

  it('should hide the stereo split when clip is mono', () => {
    const subject = renderSubject({withAudio: true, channels: 1});
    expect(subject.queryByText(/^split/i)).not.toBeInTheDocument();
  });

  it('renders the relocate option if the audio is missing', () => {
    const subject = renderSubject({withAudio: false});
    expect(subject.getByText(/relocate/i)).toBeInTheDocument();
  });

  it('calls the group action on click', () => {
    canGroupMock.mockImplementation(() => true);
    const subject = renderSubject({withAudio: true});
    subject.getByText(/^group/i).click();
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.project.groupSelectedClips(),
    );
    expect(dispatchMock).toHaveBeenCalledWith(actions.app.dismissContextMenu());
  });

  it('disables the group action when grouping is not possible', () => {
    canGroupMock.mockImplementation(() => false);
    const subject = renderSubject({});
    subject.getByText(/^group/i).click();
    expect(dispatchMock).not.toHaveBeenCalledWith(
      actions.project.groupSelectedClips(),
    );
  });

  it('calls the ungroup action on click', () => {
    canUngroupMock.mockImplementation(() => true);
    const subject = renderSubject({withAudio: true});
    subject.getByText(/ungroup/i).click();
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.project.ungroupSelectedClips(),
    );
    expect(dispatchMock).toHaveBeenCalledWith(actions.app.dismissContextMenu());
  });

  it('disables the ungroup action when ungrouping is not possible', () => {
    canUngroupMock.mockImplementation(() => false);
    const subject = renderSubject({});
    subject.getByText(/ungroup/i).click();
    expect(dispatchMock).not.toHaveBeenCalledWith(
      actions.project.ungroupSelectedClips(),
    );
  });

  it('calls the duplicate action on click', () => {
    const subject = renderSubject({withAudio: true});
    subject.getByText(/^duplicate/i).click();
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.project.duplicateSelectedClip(),
    );
    expect(dispatchMock).toHaveBeenCalledWith(actions.app.dismissContextMenu());
  });

  it('calls the relocate action on click', () => {
    const subject = renderSubject({withAudio: false});
    subject.getByText(/^relocate/i).click();
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.project.requestRelocateAsset({clipId: clipIds[0]}),
    );
    expect(dispatchMock).toHaveBeenCalledWith(actions.app.dismissContextMenu());
  });

  it('calls the stereo split action on click', () => {
    const subject = renderSubject({withAudio: true});
    subject.getByText(/^split/i).click();
    const actionParams = actions.project.splitStereoAudio({clipId: 'clip1'});
    const payload = {
      ...actionParams,
      payload: {
        ...actionParams.payload,
        leftId: expect.anything(),
        rightId: expect.anything(),
      },
    };
    expect(dispatchMock).toHaveBeenCalledWith(payload);
    expect(dispatchMock).toHaveBeenCalledWith(actions.app.dismissContextMenu());
  });
});
