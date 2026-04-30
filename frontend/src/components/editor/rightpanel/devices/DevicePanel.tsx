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
import {
  dialogPanel,
  dialogHeader,
  dialogClose,
  dialogTitle,
} from '../../../../styles/shared.styles';
import {ZIndex} from '../../../../styles/zIndex';
import {DeviceConnectionStatus} from '../../../../state/types';
import DeviceStatusIndicator from './DeviceStatusIndicator';
import {useMouseEvent} from '../../../../hooks/useMouseEvent';
import ConnectedDevices from './ConnectedDevices';
import CloseButton from '../../../common/CloseButton';

import ArrowBackIcon from '../../../../images/arrow-left.svg';

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
  panel: {
    '-webkit-app-region': 'no-drag',
    ...dialogPanel(theme),
    width: '400px',
    position: 'fixed',
    color: theme.colors.text.primary,
    top: '8px',
    right: '80px',
    zIndex: ZIndex.Popover,
  },
  header: {
    ...dialogHeader(theme),
    flexDirection: 'row',
  },
  close: {
    ...dialogClose,
  },
  title: {
    ...dialogTitle(theme),
    display: 'flex',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
}));

function DevicePanel() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const {actions, selectors, lang} = React.useContext(AppContext);

  const connectedDevices = selectors.app.getConnectedDevices();
  const isPanelOpen = selectors.app.getDevicePanelState();
  const project = selectors.project.getProjectInfo();

  const panelContainer = React.useRef<HTMLDivElement>(null);
  const [isOnboardingVisible, showOnboarding] = React.useState(false);
  const [panelRightMargin, setPanelRightMargin] = React.useState(80);

  const setPanelVisibility = (visible: boolean) => {
    dispatch(actions.app.toggleDevicePanelState({open: visible}));
  };

  const onMouseUp = React.useCallback(
    (e: MouseEvent) => {
      if (
        (!panelContainer.current ||
          !panelContainer.current.contains(e.target as Node)) &&
        isPanelOpen
      ) {
        setPanelVisibility(false);
      }
    },
    [panelContainer, isPanelOpen],
  );
  useMouseEvent('mouseup', onMouseUp);

  const onOnboard = () => {
    showOnboarding(true);
  };

  React.useEffect(() => {
    if (!isPanelOpen) showOnboarding(false);
  }, [isPanelOpen]);

  React.useEffect(() => {
    dispatch(actions.app.requestWSAuthCode());
  }, []);

  const availableDevices = Object.values(connectedDevices).filter(
    device =>
      device.status === DeviceConnectionStatus.Active ||
      device.status === DeviceConnectionStatus.Connecting,
  );

  return (
    <>
      <div className={classes.container}>
        <DeviceStatusIndicator
          onTogglePanel={() => setPanelVisibility(!isPanelOpen)}
          onChangeAbsolutePosition={rightMargin =>
            setPanelRightMargin(rightMargin)
          }
          isProjectOpen={project.isOpen}
        />
      </div>
      {isPanelOpen ? (
        <div
          className={classes.panel}
          ref={panelContainer}
          style={panelRightMargin > 0 ? {right: `${panelRightMargin}px`} : {}}>
          <div className={classes.header}>
            {isOnboardingVisible ? (
              <button
                className="hsbutton secondary borderless icon"
                style={{position: 'absolute', top: '8px', left: '8px'}}
                type="button"
                onClick={() => showOnboarding(false)}>
                <img
                  src={ArrowBackIcon}
                  style={{height: '24px', width: '24px'}}
                />
              </button>
            ) : null}
            <h5 className={classes.title}>
              {!isOnboardingVisible
                ? lang('devices.title', {smart_count: availableDevices.length})
                : lang('devices.onboarding-title')}
            </h5>
            {!isOnboardingVisible ? (
              <CloseButton
                onClick={() => setPanelVisibility(false)}
                className={classes.close}
              />
            ) : null}
          </div>
          <ConnectedDevices
            availableDevices={availableDevices}
            isOnboardingVisible={isOnboardingVisible}
            onOnboard={onOnboard}
          />
        </div>
      ) : null}
    </>
  );
}

export default React.memo(DevicePanel);
