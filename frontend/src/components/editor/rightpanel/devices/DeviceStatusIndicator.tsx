/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {AppContext} from '../../../../containers/App';
import {createAppStyle} from '../../../../styles/theme.style';
import {DeviceConnectionStatus} from '../../../../state/types';

import DeviceIcon from '../../../../images/devices.svg';

const useStyles = createAppStyle(theme => ({
  active: {
    backgroundColor: theme.colors.accent.green10,
    color: theme.colors.accent.green,
    '& img': {
      filter:
        'invert(49%) sepia(29%) saturate(1111%) hue-rotate(82deg) brightness(100%) contrast(80%)',
    },
  },
  connecting: {
    backgroundColor: theme.colors.accent.yellow10,
    color: theme.colors.accent.yellow,
    '& img': {
      filter:
        'brightness(0) saturate(100%) invert(90%) sepia(11%) saturate(5323%) hue-rotate(335deg) brightness(103%) contrast(98%);',
    },
  },
}));

interface Props {
  onTogglePanel: () => void;
  onChangeAbsolutePosition: (rightMargin: number) => void;
  isProjectOpen: boolean;
}

function DeviceStatusIndicator(props: Props) {
  const classes = useStyles();
  const {selectors, lang} = React.useContext(AppContext);
  const {onTogglePanel, onChangeAbsolutePosition, isProjectOpen} = props;

  const {size} = selectors.app.getWindowInformation();

  const buttonRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (buttonRef.current && size[0] > 0) {
      const {left, width} = buttonRef.current.getBoundingClientRect();
      onChangeAbsolutePosition(size[0] - (left + width));
    }
  }, [buttonRef.current, isProjectOpen]);

  const connectedDevices = selectors.app.getConnectedDevices();

  let label = '';
  let colorClassName = '';

  const activeDevices = Object.values(connectedDevices).filter(
    device => device.status === DeviceConnectionStatus.Active,
  );
  const connectingDevices = Object.values(connectedDevices).filter(
    device => device.status === DeviceConnectionStatus.Connecting,
  );

  if (activeDevices.length + connectingDevices.length === 0) {
    // Not connected
    label = lang('devices.status.disconnected');
  } else {
    // On or Multiple Devices
    if (activeDevices.length + connectingDevices.length === 1) {
      const device = Object.values(connectedDevices)[0];
      label =
        device?.name ??
        (device.model
          ? device.model
          : lang('devices.devices-count', {
              smart_count: activeDevices.length + connectingDevices.length,
            }));
    } else {
      label = lang('devices.devices-count', {
        smart_count: activeDevices.length + connectingDevices.length,
      });
    }
    colorClassName =
      connectingDevices.length > 0 ? classes.connecting : classes.active;
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`hsbutton secondary dark ${colorClassName}`}
      onClick={() => onTogglePanel()}>
      <img src={DeviceIcon} alt="Devices" />
      {label}
    </button>
  );
}

export default React.memo(DeviceStatusIndicator);
