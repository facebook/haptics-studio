/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import {clipboard} from 'electron';

import {IPCMessage} from '../../src/listeners';
import listeners from '../../src/listeners/menu';
import {ipcRenderer} from '../mocks/electron';
import MainApplication from '../../src/application';
import {ClipboardContent} from '../../src/hapticsSdk';

describe('menu listeners', () => {
  let response: IPCMessage;

  beforeAll(() => {
    // setup listeners
    listeners();
  });

  describe('copy', () => {
    const testAction = 'copy';
    const clipboardContent: ClipboardContent = {
      amplitude: [{time: 0, amplitude: 2}],
      frequency: [{time: 0, frequency: 3}],
    };
    beforeEach(async () => {
      jest
        .spyOn(MainApplication.instance, 'toggleMenuItems')
        .mockImplementation();
      jest.spyOn(clipboard, 'writeText').mockImplementation();
      response = await ipcRenderer.invoke(testAction, {
        payload: clipboardContent,
      });
    });

    it('should return a message with status ok', () => {
      const {status, action, payload} = response;
      expect(status).toEqual('ok');
      expect(action).toEqual(testAction);
      expect(payload).toEqual({});
    });

    it('should write in clipboard once', () => {
      expect(clipboard.writeText).toHaveBeenCalledTimes(1);
      expect(clipboard.writeText).toHaveBeenCalledWith(
        JSON.stringify(clipboardContent),
      );
    });
    it('should call toggleMenuItems', () => {
      expect(MainApplication.instance.toggleMenuItems).toHaveBeenCalledTimes(1);
      expect(MainApplication.instance.toggleMenuItems).toHaveBeenCalledWith({
        paste: true,
        paste_in_place: true,
      });
    });
  });

  describe('toggle_copy', () => {
    const testAction = 'toggle_copy';
    beforeEach(async () => {
      jest
        .spyOn(MainApplication.instance, 'toggleMenuItems')
        .mockImplementation();
      response = await ipcRenderer.invoke(testAction, {enabled: true});
    });

    it('should return a message with status ok', () => {
      const {status, action, payload} = response;
      expect(status).toEqual('ok');
      expect(action).toEqual(testAction);
      expect(payload).toEqual({});
    });
    it('should call toggleMenuItems', () => {
      expect(MainApplication.instance.toggleMenuItems).toHaveBeenCalledTimes(1);
      expect(MainApplication.instance.toggleMenuItems).toHaveBeenCalledWith({
        copy: true,
        cut: true,
      });
    });
  });
});
