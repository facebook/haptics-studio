/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import {promisify} from 'util';
import Constants from '../src/common/constants';
import ADBDevice, {ADBDeviceData} from '../src/device';

jest.mock('child_process');
const deviceId = '340YCP00000000';

describe('ADBDevice', () => {
  afterEach(() => {
    void ADBDevice.instance.stopDevicePolling();
  });

  describe('getConnectedDevices', () => {
    let adbString =
      'List of devices attached\n340YCP00000000         device 2-1 product:quest3s model:Quest_3S device:quest3s transport_id:24';
    let device: ADBDeviceData = Object.getPrototypeOf(
      ADBDevice.instance,
    ).constructor.parseDeviceLine(adbString) as ADBDeviceData;
    expect(device.id).toEqual('340YCP00000000');

    adbString =
      'List of devices attached\n2G0YC800000000         device usb:346030000 product:quest3 model:Quest_3 device:quest3 transport_id:1';
    device = Object.getPrototypeOf(
      ADBDevice.instance,
    ).constructor.parseDeviceLine(adbString) as ADBDeviceData;
    expect(device.id).toEqual('2G0YC800000000');
  });

  describe('handleDeviceDiscovery', () => {
    it('should reverse the socket port', async () => {
      const spy = jest
        .spyOn(ADBDevice.instance, 'executeADBcmd')
        .mockImplementation(() => Promise.resolve(''));
      jest
        .spyOn(ADBDevice.prototype as any, 'getConnectedDevices')
        .mockImplementation(() =>
          Promise.resolve([
            {
              id: deviceId,
            },
          ]),
        );
      ADBDevice.instance.startDevicePolling();

      await promisify(setTimeout)(200);

      expect(spy).toHaveBeenCalledWith(
        `reverse tcp:${Constants.WS.PORT} tcp:${Constants.WS.PORT}`,
        deviceId,
      );
    });
  });
});
