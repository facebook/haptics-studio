/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {useDispatch} from 'react-redux';
import {AppContext} from '../../../../containers/App';
import {createAppStyle} from '../../../../styles/theme.style';
import {DeviceConnectionStatus, Device} from '../../../../state/types';
import EmptyDevicePanelView from './nux/EmptyDevicePanelView';
import AuthCode from './nux/AuthCode';

import DeviceIcon from '../../../../images/devices.svg';
import DisconnectHeadset from '../../../../images/disconnect.svg';
import PlusIcon from '../../../../images/plus-icon.svg';

const useStyles = createAppStyle(theme => ({
  deviceView: {
    padding: '12px 16px 16px 16px',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  deviceStatusContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    paddingBottom: '16px',
    '&.multiple': {
      flexDirection: 'row',
      paddingTop: '16px',
      paddingBottom: '16px',
      '&:last-of-type': {
        borderBottomWidth: 0,
      },
    },
    '& h4': {
      margin: '10px',
      fontSize: '12px',
      fontWeight: 400,
    },
  },
  success: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    fontSize: '12px',
    lineHeight: '20px',
    gap: '4px',
    color: theme.colors.text.secondary,
    '& span': {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.3)',
    },
    '& span.active': {
      background: theme.colors.accent.green,
    },
  },
}));

interface Props {
  availableDevices: Device[];
  isOnboardingVisible: boolean;
  onOnboard: () => void;
}

function ConnectedDevices(props: Props) {
  const classes = useStyles();
  const dispatch = useDispatch();
  const {availableDevices, isOnboardingVisible} = props;
  const {actions, lang} = React.useContext(AppContext);

  const onDisconnect = (deviceId: string) => {
    dispatch(actions.app.disconnectWSDevice({deviceId}));
  };

  return (
    <div className={`${classes.deviceView} scrollbar`}>
      {availableDevices.length > 0 && !isOnboardingVisible
        ? availableDevices.map(device => {
            const deviceModel = device?.model ?? lang('devices.unknown-device');

            return (
              <div
                key={device.deviceId}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}>
                <div className={`${classes.deviceStatusContainer} multiple`}>
                  <img
                    src={DeviceIcon}
                    style={{
                      width: '50px',
                      height: '50px',
                      objectFit: 'contain',
                      marginRight: '16px',
                      marginLeft: '0',
                    }}
                  />
                  <div
                    style={{display: 'flex', flexDirection: 'column', flex: 1}}>
                    <h4
                      style={{
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}>
                      {device?.name ?? deviceModel}
                    </h4>
                    <span
                      className={classes.success}
                      style={{justifyContent: 'flex-start'}}>
                      <span
                        className={
                          device.status === DeviceConnectionStatus.Active
                            ? 'active'
                            : ''
                        }
                      />{' '}
                      {lang('devices.device-connected')}
                    </span>
                  </div>
                  <button
                    className="hsbutton secondary icon"
                    style={{flexShrink: 0, margin: '8px', fontSize: '12px'}}
                    type="button"
                    onClick={() => onDisconnect(device.deviceId)}>
                    <img src={DisconnectHeadset} style={{height: '20px'}} />
                    {lang('global.disconnect')}
                  </button>
                </div>
                {device.status === DeviceConnectionStatus.Connecting ? (
                  <div style={{paddingLeft: '68px'}}>
                    <AuthCode />
                  </div>
                ) : null}
              </div>
            );
          })
        : null}
      {availableDevices.length > 0 && !isOnboardingVisible ? (
        <button
          className="hsbutton secondary icon"
          type="button"
          style={{
            alignSelf: 'center',
            width: 'min-content',
            whiteSpace: 'nowrap',
            marginTop: '8px',
          }}
          onClick={() => props.onOnboard()}>
          <img src={PlusIcon} style={{height: '24px', width: '24px'}} />
          {lang('devices.add-new-device')}
        </button>
      ) : null}
      {availableDevices.length === 0 || isOnboardingVisible ? (
        <EmptyDevicePanelView availableDevices={availableDevices} />
      ) : null}
    </div>
  );
}

export default React.memo(ConnectedDevices);
