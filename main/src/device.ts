/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-await-in-loop */

import {exec} from 'child_process';
import {EOL} from 'os';
import Logger from './common/logger';
import {escapeFilePath, getAdbPath, isOnWindows} from './common/utils';
import Constants from './common/constants';

const singletonEnforcer = Symbol('singletonEnforcer');

const DevicePollingInterval = process.env.NODE_ENV === 'test' ? 100 : 3000;
const DevicePattern =
  /(?<serial>\S+|\(no serial number\))\s+(?<state>\S+)(?: (?!product:)(usb:)?(?<usb>\S+))?(?: product:(?<product>\S+))?(?: model:(?<model>\S+))?(?: device:(?<device>\S+))? transport_id:(?<transport_id>\d+)/;

export enum ConnectionState {
  offline = 'offline',
  bootloader = 'bootloader',
  device = 'device',
  host = 'host',
  recovery = 'recovery',
  rescue = 'rescue',
  sideload = 'sideload',
  unauthorized = 'unauthorized',
  authorizing = 'authorizing',
  connecting = 'connecting',
  unknown = 'unknown',
}

export interface ADBDeviceData {
  deviceType?: string;
  id: string;
  model?: string;
  product?: string;
  state: ConnectionState;
  transportId: string;
  usb?: string;
}

export default class ADBDevice {
  private static singleton: ADBDevice;

  private pollDevices?: NodeJS.Timeout;

  private adbPath = escapeFilePath(getAdbPath());

  private knownDevices: {[serial: string]: ADBDeviceData} = {};

  private running = false;

  /**
   * Represents an instance of the device handler that interfaces with ADB
   * @constructor
   * */
  constructor(enforcer: symbol) {
    if (enforcer !== singletonEnforcer) {
      throw new Error('Cannot construct singleton');
    }
  }

  /**
   * Returns the current instance
   * @return { ADBDevice } - Current ADBDevice instance
   * */
  static get instance(): ADBDevice {
    if (!ADBDevice.singleton) {
      ADBDevice.singleton = new ADBDevice(singletonEnforcer);
    }
    return ADBDevice.singleton;
  }

  public startDevicePolling(): void {
    this.running = true;
    this.pollDevices = setInterval(() => {
      if (!this.running) return;

      void this.getConnectedDevices().then(devices => {
        void this.handleDeviceDiscovery(devices);
      });
    }, DevicePollingInterval);
  }

  public async stopDevicePolling(): Promise<void> {
    this.running = false;
    if (this.pollDevices) {
      clearInterval(this.pollDevices);
    }
    if (isOnWindows()) {
      await this.killServer();
    }
  }

  public getCurrentDevices(): {[serial: string]: ADBDeviceData} {
    return this.knownDevices;
  }

  private async handleDeviceDiscovery(devices: ADBDeviceData[]) {
    try {
      // eslint-disable-next-line no-restricted-syntax
      for (const device of devices) {
        if (!this.knownDevices[device.id]) {
          // New device connected
          this.knownDevices[device.id] = device;
          await this.executeADBcmd(
            `reverse tcp:${Constants.WS.PORT} tcp:${Constants.WS.PORT}`,
            device.id,
          );
        }
      }
      const availableDevices = devices.map(d => d.id);
      Object.keys(this.knownDevices).forEach(id => {
        if (!availableDevices.includes(id)) {
          // Device lost
          delete this.knownDevices[id];
        }
      });
    } catch (error) {
      Logger.error((error as Error).message);
    }
  }

  private killServer(): Promise<string> {
    return ADBDevice.execAsync(`${this.adbPath} kill-server`);
  }

  public shell(cmd: string, device: string): Promise<string> {
    return ADBDevice.execAsync(
      `${this.adbPath} -s ${device} shell taskset 0000000F ${cmd}`,
    );
  }

  public executeADBcmd(cmd: string, device: string): Promise<string> {
    return ADBDevice.execAsync(`${this.adbPath} -s ${device} ${cmd}`);
  }

  public push(local: string, remote: string, device: string): Promise<string> {
    return ADBDevice.execAsync(
      `${this.adbPath} -s ${device} push "${local}" ${remote}`,
    );
  }

  private static execAsync(command: string): Promise<string> {
    if (process.env.NODE_ENV === 'test') {
      return Promise.resolve('');
    }
    return new Promise((resolve, reject) => {
      Logger.silly('Running ADB command:', command);
      return exec(command, {encoding: 'utf-8'}, (error, stdout, stderr) => {
        if (!error && !stderr) {
          resolve(stdout);
        } else {
          reject(error ?? stderr);
        }
      });
    });
  }

  private async getConnectedDevices(): Promise<ADBDeviceData[]> {
    try {
      const command = `${this.adbPath} devices -l`;
      const devicesOutputString = await ADBDevice.execAsync(command);
      return devicesOutputString
        .split(EOL)
        .filter(line => line.length > 0)
        .slice(1) // first line is a header
        .map(ADBDevice.parseDeviceLine)
        .filter((d): d is ADBDeviceData => !!d);
    } catch {
      return [];
    }
  }

  private static parseDeviceLine = (line: string): ADBDeviceData | undefined => {
    const match = DevicePattern.exec(line);
    if (!match || !match.groups) {
      return undefined;
    }
    const state = match.groups.state as ConnectionState;
    return {
      deviceType: match.groups.device,
      id: match.groups.serial,
      model: match.groups.model,
      product: match.groups.product,
      state,
      transportId: match.groups.transport_id,
      usb: match.groups.usb,
    };
  };
}
