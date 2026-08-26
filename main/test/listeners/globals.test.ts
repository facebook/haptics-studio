/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {clipboard, shell} from 'electron';

import {IpcSendChannel} from '../../../shared';
import listeners, {isAllowedExternalUrl} from '../../src/listeners/globals';
import {ipcRenderer} from '../mocks/electron';

describe('global listeners', () => {
  beforeAll(() => {
    listeners();
  });

  it.each([
    'https://developers.meta.com/horizon/resources/haptics-studio/',
    'https://github.com/facebook/haptics-studio/issues',
    'https://www.youtube.com/watch?v=test',
  ])('allows a trusted external URL: %s', url => {
    expect(isAllowedExternalUrl(url)).toBe(true);
  });

  it.each([
    'http://www.youtube.com/watch?v=test',
    'file:///tmp/attack.html',
    'javascript:alert(1)',
    'https://example.com/',
    'not a URL',
  ])('rejects an untrusted external URL: %s', url => {
    expect(isAllowedExternalUrl(url)).toBe(false);
  });

  it('opens allowlisted URLs from the renderer', async () => {
    const url = 'https://www.meta.com/experiences/6759764157450104/';
    ipcRenderer.send(IpcSendChannel.OpenExternalUrl, {url});
    await new Promise(resolve => setTimeout(resolve, 5));

    expect(shell.openExternal).toHaveBeenCalledWith(url);
  });

  it('does not open non-allowlisted URLs from the renderer', async () => {
    ipcRenderer.send(IpcSendChannel.OpenExternalUrl, {
      url: 'https://example.com/',
    });
    await new Promise(resolve => setTimeout(resolve, 5));

    expect(shell.openExternal).not.toHaveBeenCalled();
  });

  it('writes renderer text to the clipboard', async () => {
    ipcRenderer.send(IpcSendChannel.WriteClipboardText, {text: 'copied'});
    await new Promise(resolve => setTimeout(resolve, 5));

    expect(clipboard.writeText).toHaveBeenCalledWith('copied');
  });
});
