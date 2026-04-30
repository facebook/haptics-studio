/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {IpcInvokeChannel} from '../../../shared';
import {createIPCHandler} from './ipcHandlerUtils';
import MainApplication from '../application';
import WSServer from '../wsServer';

function disconnectDevice(): void {
  createIPCHandler<{deviceId: string}>(
    IpcInvokeChannel.DisconnectDevice,
    args => {
      if (args.deviceId) {
        WSServer.instance.disconnectClient(args.deviceId);
      }
    },
  );
}

function requestAuthorizationCode(): void {
  createIPCHandler<void>(IpcInvokeChannel.WsAuthCodeRequest, () => {
    WSServer.instance.runAuthorizationWorkflow();
  });
}

function requestDevicesStatus(): void {
  createIPCHandler<void>(IpcInvokeChannel.DevicesStatusRequest, () => {
    const info = WSServer.instance.getDevicesInfo();
    MainApplication.instance.sendToUI('devices_status', info);
    return {payload: info};
  });
}

function toggleDevicePanel(): void {
  createIPCHandler<{open: boolean}>(
    IpcInvokeChannel.ToggleDevicePanel,
    args => {
      const {open = false} = args;
      MainApplication.instance.setDevicePanelOpen(open);
      if (open) {
        WSServer.instance.startUdpAdvertising();
      } else {
        // When the device panel is closed, stop udp advertisement only if connected devices > 0
        const connectedDevicesCount = Object.keys(
          WSServer.instance.getDevicesInfo(),
        ).length;
        if (connectedDevicesCount > 0) {
          WSServer.instance.stopUdpAdvertising();
        }
      }
    },
  );
}

function stopAdvertising(): void {
  createIPCHandler<void>(IpcInvokeChannel.StopAdvertising, () => {
    WSServer.instance.stopUdpAdvertising();
  });
}

/**
 * Bind IPC messages
 */
export default function (): void {
  disconnectDevice();
  requestAuthorizationCode();
  requestDevicesStatus();
  toggleDevicePanel();
  stopAdvertising();
}
