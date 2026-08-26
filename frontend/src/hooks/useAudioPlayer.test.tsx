/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {Provider} from 'react-redux';
import {renderHook} from '@testing-library/react-hooks';
import {waitFor} from '@testing-library/react';

import {createStore} from '../state/store';
import {useAudioPlayer} from './useAudioPlayer';

const audioPlayerRef = {current: null};
const setAudioPlayingAction = (payload: {isPlaying: boolean}) => ({
  type: 'test/setAudioPlaying',
  payload,
});

const wrapper = ({
  children,
}: React.PropsWithChildren<{audioChannels?: number}>) => (
  <Provider store={createStore()}>{children}</Provider>
);

describe('useAudioPlayer', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation();
    URL.createObjectURL = jest.fn().mockReturnValue('blob:audio');
    URL.revokeObjectURL = jest.fn();
  });

  it('retries the same audio path after the main process verifies it', async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock
      .mockResolvedValueOnce({ok: false, status: 403})
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        blob: jest.fn().mockResolvedValue(new Blob(['audio'])),
      });

    const {result, rerender} = renderHook<
      {audioChannels?: number},
      ReturnType<typeof useAudioPlayer>
    >(
      ({audioChannels}) =>
        useAudioPlayer({
          currentClipId: 'clip-1',
          audioPlayerRef,
          audioPath: '/tmp/new-clip.wav',
          audioChannels,
          isOnWindows: false,
          setAudioPlayingAction,
        }),
      {initialProps: {audioChannels: undefined}, wrapper},
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    rerender({audioChannels: 2});

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.audioBlobUrl).toBe('blob:audio'));
  });

  it('never exposes a blob URL that was revoked when the clip changed', async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        blob: jest.fn().mockResolvedValue(new Blob(['audio'])),
      }),
    );

    let blobCount = 0;
    (URL.createObjectURL as jest.Mock).mockImplementation(
      () => `blob:audio-${++blobCount}`,
    );
    const revoked: string[] = [];
    (URL.revokeObjectURL as jest.Mock).mockImplementation((url: string) => {
      revoked.push(url);
    });

    const {result, rerender} = renderHook<
      {currentClipId: string; audioPath: string},
      ReturnType<typeof useAudioPlayer>
    >(
      ({currentClipId, audioPath}) =>
        useAudioPlayer({
          currentClipId,
          audioPlayerRef,
          audioPath,
          audioChannels: 2,
          isOnWindows: false,
          setAudioPlayingAction,
        }),
      {
        initialProps: {currentClipId: 'clip-1', audioPath: '/tmp/clip-1.wav'},
        wrapper,
      },
    );

    await waitFor(() =>
      expect(result.current.audioBlobUrl).toBe('blob:audio-1'),
    );

    rerender({currentClipId: 'clip-2', audioPath: '/tmp/clip-2.wav'});

    // The effect cleanup revokes the previous clip's URL during this rerender.
    // Handing it back here would mount an <audio> element pointing at a dead
    // blob and surface ERR_FILE_NOT_FOUND.
    expect(revoked).toContain('blob:audio-1');
    expect(result.current.audioBlobUrl).toBeUndefined();

    await waitFor(() =>
      expect(result.current.audioBlobUrl).toBe('blob:audio-2'),
    );
    expect(revoked).not.toContain('blob:audio-2');
  });
});
