/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import _ from 'lodash';

import {ipcRenderer} from '../mocks/electron';
import Project from '../../src/common/project';
import {IPCMessage} from '../../src/listeners';
import listeners from '../../src/listeners/device';
import MainApplication from '../../src/application';
import WSServer, {DeviceInfo} from '../../src/wsServer';
import {generateMockContent} from '../mocks/project';

describe('device listeners', () => {
  const projectMock = generateMockContent();

  let response: IPCMessage;

  beforeAll(() => {
    // setup listeners
    listeners();
  });

  beforeEach(() => {
    jest
      .spyOn(MainApplication.instance, 'reloadMenuItems')
      .mockImplementation();
    jest
      .spyOn(MainApplication.instance, 'isAdbDeviceMounted')
      .mockReturnValue(true);
    // TODO mock exec
    Project.instance.loadContent(_.cloneDeep(projectMock.defautProjectContent));
  });

  describe('disconnect device', () => {
    const testAction = 'disconnect_device';

    beforeEach(async () => {
      jest.spyOn(WSServer.instance, 'disconnectClient').mockReturnValue();
      response = await ipcRenderer.invoke(testAction, {
        deviceId: projectMock.deviceId,
      });
    });

    it('should return ok message', () => {
      expect(response.status).toBe('ok');
    });

    it('should call disconnectClient once', () => {
      expect(WSServer.instance.disconnectClient).toHaveBeenCalledTimes(1);
      expect(WSServer.instance.disconnectClient).toHaveBeenCalledWith(
        projectMock.deviceId,
      );
    });
  });
  describe('toggle device panel', () => {
    const testAction = 'toggle_device_panel';

    beforeEach(() => {
      jest.spyOn(WSServer.instance, 'startUdpAdvertising').mockReturnValue();
      jest.spyOn(WSServer.instance, 'stopUdpAdvertising').mockReturnValue();
    });

    describe('on open', () => {
      beforeEach(async () => {
        response = await ipcRenderer.invoke(testAction, {open: true});
      });

      it('should return ok message', () => {
        expect(response.status).toBe('ok');
      });

      it('should start udp advertising', () => {
        expect(WSServer.instance.startUdpAdvertising).toHaveBeenCalledTimes(1);
      });
    });

    describe('on close', () => {
      it('should return ok message', () => {
        expect(response.status).toBe('ok');
      });

      describe('without connected devices', () => {
        beforeEach(async () => {
          response = await ipcRenderer.invoke(testAction, {open: false});
        });

        it('should not stop udp advertising', () => {
          expect(WSServer.instance.stopUdpAdvertising).toHaveBeenCalledTimes(0);
        });
      });

      describe('with already connected devices', () => {
        beforeEach(async () => {
          jest
            .spyOn(WSServer.instance, 'getDevicesInfo')
            .mockReturnValue({my_device: {} as DeviceInfo});
          response = await ipcRenderer.invoke(testAction, {open: false});
        });

        it('should not stop udp advertising', () => {
          expect(WSServer.instance.stopUdpAdvertising).toHaveBeenCalledTimes(1);
        });
      });
    });
  });
});
