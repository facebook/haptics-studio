/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Logger from '../../src/common/logger';
import ClipboardService, {
  ClipboardCallbacks,
} from '../../src/services/ClipboardService';
import {clipboard} from '../mocks/electron';

const validContent = {
  amplitude: [{time: 0, amplitude: 1, emphasis: {amplitude: 1, frequency: 1}}],
  frequency: [{time: 0, frequency: 1}],
};
const validText = JSON.stringify(validContent);

describe('ClipboardService', () => {
  let callbacks: jest.Mocked<ClipboardCallbacks>;
  let service: ClipboardService;

  beforeEach(() => {
    jest.useFakeTimers();
    clipboard.readText.mockReset();
    callbacks = {
      onTextChange: jest.fn(),
      sendToUI: jest.fn(),
    };
    service = new ClipboardService(callbacks);
    jest.spyOn(Logger, 'error').mockImplementation();
  });

  afterEach(() => {
    service.stopWatching();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('initializes the cached text and paste state asynchronously', async () => {
    clipboard.readText.mockResolvedValue(validText);

    await service.startWatching(() => true);

    expect(service.isValid()).toBe(true);
    expect(service.containsEmphasis()).toBe(true);
    expect(callbacks.onTextChange).toHaveBeenCalledWith(true);
  });

  it('notifies only when the clipboard text changes', async () => {
    clipboard.readText
      .mockResolvedValueOnce(validText)
      .mockResolvedValueOnce(validText)
      .mockResolvedValueOnce('invalid');

    await service.startWatching(() => true);
    jest.advanceTimersByTime(1000);
    await Promise.resolve();
    jest.advanceTimersByTime(1000);
    await Promise.resolve();

    expect(callbacks.onTextChange).toHaveBeenNthCalledWith(1, true);
    expect(callbacks.onTextChange).toHaveBeenNthCalledWith(2, false);
    expect(callbacks.onTextChange).toHaveBeenCalledTimes(2);
  });

  it('reads fresh clipboard content before sending it to the UI', async () => {
    clipboard.readText.mockResolvedValue(validText);

    await service.sendContent('paste');

    expect(callbacks.sendToUI).toHaveBeenCalledWith('paste', {
      action: 'paste',
      status: 'ok',
      payload: validContent,
    });
  });

  it('reports clipboard read failures to the UI', async () => {
    clipboard.readText.mockRejectedValue(new Error('Clipboard unavailable'));

    await service.sendContent('paste');

    expect(Logger.error).toHaveBeenCalledWith(
      'Clipboard unavailable',
      expect.any(String),
    );
    expect(callbacks.sendToUI).toHaveBeenCalledWith('paste', {
      action: 'paste',
      status: 'error',
      message: 'Clipboard unavailable',
    });
  });

  it('notifies when invalid pasted content is observed by the watcher', async () => {
    clipboard.readText.mockResolvedValue(validText);
    await service.startWatching(() => true);

    clipboard.readText.mockResolvedValue('invalid');
    await service.sendContent('paste');
    jest.advanceTimersByTime(1000);
    await Promise.resolve();

    expect(callbacks.onTextChange).toHaveBeenNthCalledWith(1, true);
    expect(callbacks.onTextChange).toHaveBeenNthCalledWith(2, false);
    expect(callbacks.onTextChange).toHaveBeenCalledTimes(2);
  });

  it('stops polling the clipboard', async () => {
    clipboard.readText.mockResolvedValue(validText);
    await service.startWatching(() => true);

    service.stopWatching();
    jest.advanceTimersByTime(1000);
    await Promise.resolve();

    expect(clipboard.readText).toHaveBeenCalledTimes(1);
  });
});
