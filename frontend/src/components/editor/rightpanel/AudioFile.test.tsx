/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';
import {fireEvent} from '@testing-library/react';

import {render, cleanup, RenderResult} from '../../../test-utils';
import AudioFile from './AudioFile';
import actions from '../../../state/actions';
import {Audio} from '../../../state/types';

afterEach(cleanup);

const dispatchMock = jest.fn();
const clipId = 'clip1';

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => dispatchMock,
}));

const renderSubject = (options: {audio: Audio | undefined}): RenderResult => {
  return render(<AudioFile hideActionButton={false} />, {
    selectors: {
      project: {
        getCurrentClipAudio: () => options.audio,
        getCurrentClipId: () => clipId,
      },
    },
  });
};

describe('<AudioFile />', () => {
  beforeEach(() => {
    dispatchMock.mockClear();
  });

  it('should let the user add audio when the clip has none', () => {
    const subject = renderSubject({audio: undefined});
    expect(subject.getByText(/no audio/i)).toBeInTheDocument();
    subject.getByTestId('audio-button').click();
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.project.requestAddAudioToClip({clipId}),
    );
  });

  it('should let the user change the audio if the original file is missing', () => {
    const subject = renderSubject({audio: {path: '/some/path', exists: false}});
    subject.getByTestId('audio-button').click();
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.project.requestRelocateAsset({clipId}),
    );
  });

  it('should let the user locate the file in the file system when the audio file is valid', () => {
    const subject = renderSubject({
      audio: {path: '/some/path/file.wav', exists: true},
    });
    expect(subject.getByText('file.wav')).toBeInTheDocument();
    subject.getByTestId('audio-button').click();
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.project.openSystemFolder({path: '/some/path/file.wav'}),
    );
  });

  it('should show play button only when audio file exists', () => {
    const subject = renderSubject({
      audio: {path: '/some/path/file.wav', exists: true},
    });
    expect(subject.getByTestId('audio-button')).toBeInTheDocument();
    expect(subject.getByTestId('play-button')).toBeInTheDocument();
  });

  it('should not show play button when audio file does not exist', () => {
    const subject = renderSubject({audio: undefined});
    expect(subject.getByTestId('audio-button')).toBeInTheDocument();
    expect(subject.queryByTestId('play-button')).not.toBeInTheDocument();
  });

  it('should not show play button when audio file is missing', () => {
    const subject = renderSubject({audio: {path: '/some/path', exists: false}});
    expect(subject.getByTestId('audio-button')).toBeInTheDocument();
    expect(subject.queryByTestId('play-button')).not.toBeInTheDocument();
  });

  it('should dispatch play_audio event when play button is clicked', () => {
    const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');
    const subject = renderSubject({
      audio: {path: '/some/path/file.wav', exists: true},
    });
    const playButton = subject.getByTestId('play-button');
    playButton.click();
    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({type: 'play_audio'}),
    );
    dispatchEventSpy.mockRestore();
  });

  it('should show tooltip on hover for action button when no audio', () => {
    const subject = renderSubject({audio: undefined});
    const button = subject.getByTestId('audio-button');
    fireEvent.mouseEnter(button);
    expect(subject.getByText('Add Audio')).toBeInTheDocument();
  });

  it('should show tooltip on hover for action button when audio exists', () => {
    const subject = renderSubject({
      audio: {path: '/some/path/file.wav', exists: true},
    });
    const actionButton = subject.getByTestId('audio-button');
    fireEvent.mouseEnter(actionButton);
    expect(subject.getByText('Locate File')).toBeInTheDocument();
  });

  it('should show tooltip on hover for play button', () => {
    const subject = renderSubject({
      audio: {path: '/some/path/file.wav', exists: true},
    });
    const playButton = subject.getByTestId('play-button');
    fireEvent.mouseEnter(playButton);
    expect(subject.getByText(/play audio/i)).toBeInTheDocument();
  });

  it('should hide tooltip on mouse leave for action button', () => {
    const subject = renderSubject({audio: undefined});
    const button = subject.getByTestId('audio-button');
    fireEvent.mouseEnter(button);
    expect(subject.getByText('Add Audio')).toBeInTheDocument();
    fireEvent.mouseLeave(button);
    expect(subject.queryByText('Add Audio')).not.toBeInTheDocument();
  });

  it('should hide tooltip on mouse leave for play button', () => {
    const subject = renderSubject({
      audio: {path: '/some/path/file.wav', exists: true},
    });
    const playButton = subject.getByTestId('play-button');
    fireEvent.mouseEnter(playButton);
    expect(subject.getByText(/play audio/i)).toBeInTheDocument();
    fireEvent.mouseLeave(playButton);
    expect(subject.queryByText(/play audio/i)).not.toBeInTheDocument();
  });

  it('should show play button with reduced opacity for unsupported AIFF format', () => {
    const subject = renderSubject({
      audio: {path: '/some/path/file.aiff', exists: true},
    });
    const playButton = subject.getByTestId('play-button');
    expect(playButton).toBeInTheDocument();
    expect(playButton).toHaveStyle({opacity: 0.5});
    subject.getByTestId('audio-button').click();
    expect(dispatchMock).not.toHaveBeenCalledWith(
      actions.project.requestAddAudioToClip({clipId}),
    );
  });

  it('should show play button with reduced opacity for .aif extension', () => {
    const subject = renderSubject({
      audio: {path: '/some/path/file.aif', exists: true},
    });
    const playButton = subject.getByTestId('play-button');
    expect(playButton).toBeInTheDocument();
    expect(playButton).toHaveStyle({opacity: 0.5});
    expect(dispatchMock).not.toHaveBeenCalledWith(
      actions.project.requestAddAudioToClip({clipId}),
    );
  });
});
