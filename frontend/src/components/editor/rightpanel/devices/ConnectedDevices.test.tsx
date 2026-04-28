/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';

import {render, cleanup, RenderResult} from '../../../../test-utils';
import ConnectedDevices from './ConnectedDevices';
import actions from '../../../../state/actions';
import {Device, DeviceConnectionStatus} from '../../../../state/types';

afterEach(cleanup);

const dispatchMock = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => dispatchMock,
}));

const renderSubject = (options: {
  status?: DeviceConnectionStatus;
  name?: string;
  model?: string;
}): RenderResult => {
  const {
    name = 'Quest 3',
    model = 'Oculus Quest 3',
    status = DeviceConnectionStatus.Active,
  } = options;
  const devices: Device[] = [
    {
      deviceId: '1',
      status,
      name,
      model,
      version: '1.0',
    },
  ];
  return render(
    <ConnectedDevices
      availableDevices={devices}
      isOnboardingVisible={false}
      onOnboard={() => {}}
    />,
    {
      selectors: {
        app: {
          getWSAuthCode: () => '1234',
        },
      },
    },
  );
};

describe('<ConnectedDevices />', () => {
  afterEach(() => {
    dispatchMock.mockClear();
  });

  describe('when a device is connected via network', () => {
    it('should render the Quest 3 image', () => {
      const element = renderSubject({});
      expect(element).toMatchSnapshot();
    });

    it('should render the Quest 3S image', () => {
      const element = renderSubject({
        name: 'Quest 3S',
        model: 'Oculus Quest 3S',
      });
      expect(element).toMatchSnapshot();
    });

    it('should let the user disconnect', () => {
      const element = renderSubject({});
      element.getByText(/disconnect/i).click();
      expect(dispatchMock).toHaveBeenCalledWith(
        actions.app.disconnectWSDevice({deviceId: '1'}),
      );
    });
  });

  describe('when a device is attempting to connect via network', () => {
    it('should let the user disconnect', () => {
      const element = renderSubject({
        status: DeviceConnectionStatus.Connecting,
      });
      expect(element.getByText('1')).toBeVisible();
      expect(element.getByText('2')).toBeVisible();
      expect(element.getByText('3')).toBeVisible();
      expect(element.getByText('4')).toBeVisible();
    });
  });
});
