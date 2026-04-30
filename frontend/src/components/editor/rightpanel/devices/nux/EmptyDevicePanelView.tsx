/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {shell} from 'electron';
import {AppContext} from '../../../../../../src/containers/App';
import {Device} from '../../../../../../src/state/types';
import {createAppStyle} from '../../../../../../src/styles/theme.style';
import {AppLabUrl} from '../../../../../../src/globals/constants';

import DeviceIcon from '../../../../../images/devices.svg';

const useStyles = createAppStyle(theme => ({
  emptyView: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    padding: `0px ${theme.spacing.sm}`,
    '& h4': {
      margin: '10px',
      ...theme.typography.title,
      fontWeight: 400,
    },
  },
  body: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: theme.spacing.xs,
    ...theme.typography.body,
    gap: theme.spacing.sm,
    color: theme.colors.text.primary,
  },
  missingDeviceIcon: {
    marginBottom: theme.spacing.lg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '& img': {
      width: '30px',
      height: '30px',
    },
  },
}));

interface Props {
  availableDevices: Device[];
}

function EmptyDevicePanelView(props: Props) {
  const classes = useStyles();
  const {lang} = React.useContext(AppContext);
  const {availableDevices} = props;

  const openMetaStore = () => {
    void shell.openExternal(AppLabUrl);
  };

  return (
    <div className={classes.emptyView}>
      <div className={classes.missingDeviceIcon}>
        <img src={DeviceIcon} alt="Unknown Device" />
        <h4>
          {availableDevices.length > 0
            ? lang('devices.action-connect-new-device')
            : null}
        </h4>
      </div>
      <span className={classes.body}>
        {lang('devices.cta-pair-new-device')}
      </span>
      <button
        type="button"
        className="hsbutton"
        style={{margin: '24px 0px 0', height: '28px'}}
        onClick={() => openMetaStore()}>
        {lang('devices.action-open-store')}
      </button>
    </div>
  );
}

export default React.memo(EmptyDevicePanelView);
