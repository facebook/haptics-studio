/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {IpcInvokeChannel} from '../../../../shared';
import {typedInvoke} from '../../../../shared/typed-ipc';
import {AppContext} from '../../containers/App';
import {createAppStyle} from '../../styles/theme.style';
import {ZIndex} from '../../styles/zIndex';
import {useKeyboardEvent} from '../../hooks/useKeyboardEvent';
import {mediaPath} from '../../globals/utils';

import DeviceIcon from '../../images/audio-output.svg';

const useStyles = createAppStyle(theme => ({
  container: {
    '-webkit-app-region': 'no-drag',
    display: 'flex',
    gap: '2px',
    '& button': {
      borderRadius: '2px',
    },
    '& button:first-of-type': {
      borderTopLeftRadius: theme.sizes.borderRadius.card,
      borderBottomLeftRadius: theme.sizes.borderRadius.card,
    },
    '& button:last-of-type': {
      borderTopRightRadius: theme.sizes.borderRadius.card,
      borderBottomRightRadius: theme.sizes.borderRadius.card,
    },
  },
  controller: {
    position: 'relative',
    display: 'flex',
    alignContent: 'center',
    justifyContent: 'center',
    width: '24px',
    '& aside': {
      position: 'absolute',
      bottom: '0px',
      right: '0px',
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: theme.colors.accent.blue,
    },
  },
  active: {
    backgroundColor: theme.colors.accent.green10,
    color: theme.colors.accent.blue,
  },
  devices: {
    backgroundColor: theme.colors.background.exportPopover,
    position: 'fixed',
    top: '50px',
    right: '50px',
    zIndex: ZIndex.System,
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing.md,
    '& span': {
      padding: '4px 8px',
      '&:hover': {
        backgroundColor: theme.colors.background.hover,
      },
    },
  },
  device: {
    width: '100%',
    textAlign: 'left',
  },
}));

/**
 * External Auditioning - Experimental feature
 *
 * This component is used to audition the haptic and audio files on a connected extenal device
 */
function ExternalAuditioning() {
  const classes = useStyles();
  const {selectors} = React.useContext(AppContext);
  const clipId = selectors.project.getCurrentClipId();
  const defaultControlsEnabled = selectors.app.getDefaultControlStatus();
  const project = selectors.project.getProjectInfo();
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [showDevices, setShowDevices] = useState<boolean>(false);
  const [connectedDevice, setConnectedDevice] = useState<string | undefined>();
  const audioContext = useRef<AudioContext>();
  const deviceContext = useRef<AudioContext>();
  const isOnWindows = selectors.app.isOnWindows();

  useEffect(() => {
    audioContext.current = new AudioContext();
    deviceContext.current = new AudioContext();
    navigator.mediaDevices.addEventListener('devicechange', () => {
      void getConnectedDevices();
    });
    void getConnectedDevices();
  }, []);

  const getConnectedDevices = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const oudioOutputs = devices.filter(
      device =>
        device.kind === 'audiooutput' /* && (device.label.includes('054c:')) */,
    );
    setDevices(oudioOutputs);
  };

  const bufferSourceFor = async (context: AudioContext, fileName: string) => {
    const hapticBuffer = await (
      await fetch(mediaPath(fileName, isOnWindows))
    ).arrayBuffer();
    const hapticData = await context.decodeAudioData(hapticBuffer);
    const bufferSource = context.createBufferSource();

    bufferSource.buffer = hapticData;
    bufferSource.connect(context.destination);

    return bufferSource;
  };

  const play = async () => {
    if (!clipId) {
      return;
    }

    const response = await typedInvoke(IpcInvokeChannel.ExternalAuditioning, {
      clipId,
    });

    if (response.status === 'ok' && response.payload) {
      const {haptic, audio} = response.payload;

      const buffers: AudioBufferSourceNode[] = [];
      if (audioContext.current && audio) {
        buffers.push(
          await bufferSourceFor(audioContext.current, audio as string),
        );
      }
      if (deviceContext.current && connectedDevice) {
        (deviceContext.current as any).setSinkId(connectedDevice);
        buffers.push(
          await bufferSourceFor(deviceContext.current, haptic as string),
        );
      }

      // The streams will be scheduled in the near future to improve synchronicity
      buffers.forEach(b => b.start(b.context.currentTime + 0.01));
    }
  };

  const onKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (
        e.key === ' ' &&
        project.isOpen &&
        clipId &&
        !defaultControlsEnabled
      ) {
        void play();
      }
    },
    [
      clipId,
      defaultControlsEnabled,
      project.isOpen,
      clipId,
      connectedDevice,
      deviceContext.current,
    ],
  );
  useKeyboardEvent('keyup', onKeyPress);

  const onDeviceChange = useCallback(
    (device: MediaDeviceInfo) => {
      if (device.deviceId === connectedDevice) {
        setConnectedDevice(undefined);
      } else {
        setConnectedDevice(device.deviceId);
      }
      setShowDevices(false);
    },
    [connectedDevice],
  );

  return (
    <>
      <div className={classes.container}>
        <button
          ref={buttonRef}
          type="button"
          className="hsbutton secondary borderless dark"
          onClick={() => setShowDevices(!showDevices)}>
          <span className={classes.controller}>
            <img src={DeviceIcon} alt="Left Controller" />
            {connectedDevice !== undefined ? <aside /> : null}
          </span>
        </button>
        {showDevices && devices.length > 0 ? (
          <div className={classes.devices}>
            {devices.map((device, index) => (
              <span
                key={index}
                className={`${classes.device} ${connectedDevice === device.deviceId ? classes.active : ''}`}
                onClick={() => onDeviceChange(device)}>
                {device.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}

export default React.memo(ExternalAuditioning);
