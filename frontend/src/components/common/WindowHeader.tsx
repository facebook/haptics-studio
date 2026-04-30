/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {useDispatch} from 'react-redux';
import {createAppStyle} from '../../styles/theme.style';
import {AppContext} from '../../containers/App';
import DevicePanel from '../editor/rightpanel/devices/DevicePanel';
import ExternalAuditioning from './ExternalAuditioning';
import SnowParticles from './SnowParticles';

import ArrowIcon from '../../images/chevron-up.svg';

const useStyles = createAppStyle(theme => ({
  container: {
    maxWidth: '100vw',
    position: 'relative',
    height: theme.sizes.windowHeaderHeight,
    width: '100vw',
    '-webkit-app-region': 'drag',
    '-webkit-user-select': 'none',
  },
  title: {
    position: 'absolute',
    maxWidth: '80%',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    top: 0,
    height: theme.sizes.windowHeaderHeight,
    '& span': {
      color: theme.colors.text.primary,
      ...theme.typography.body,
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
    },
  },
  leftToolbar: {
    height: theme.sizes.windowHeaderHeight,
    position: 'absolute',
    top: '0',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    '& button': {
      objectFit: 'contain',
      '-webkit-app-region': 'no-drag',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      '& img': {
        width: '20px',
        height: '20px',
      },
    },
  },
  rightToolbar: {
    height: theme.sizes.windowHeaderHeight,
    position: 'absolute',
    top: '0',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
}));

function WindowHeader() {
  const dispatch = useDispatch();
  const {selectors, actions, lang} = React.useContext(AppContext);
  const classes = useStyles();
  const isOnWindows = selectors.app.isOnWindows();
  const project = selectors.project.getProjectInfo();
  const windowInfo = selectors.app.getWindowInformation();
  const termsAccepted = selectors.app.areTermsAccepted();
  const updateInfo = selectors.app.getUpdaterInfo();
  const currentSection = selectors.app.getLandingPageSection();

  const extenalAudioFlagEnabled =
    localStorage.getItem('flags:externalAudio') === 'true';

  React.useEffect(() => {
    dispatch(actions.app.requestDevicesStatus());
  }, []);

  const onClose = () => {
    dispatch(actions.project.closeCurrentProject());
  };

  return (
    <div
      className={classes.container}
      style={project.isOpen || !termsAccepted ? {borderWidth: 0} : {}}>
      <SnowParticles />
      {termsAccepted ? (
        <div
          className={classes.leftToolbar}
          style={{
            left: !isOnWindows
              ? `${8 + (windowInfo.fullScreen ? 0 : 78)}px`
              : '8px',
          }}>
          {project.isOpen ? (
            <button
              type="button"
              className="hsbutton icon-start secondary borderless dark"
              onClick={() => onClose()}>
              <img
                src={ArrowIcon}
                alt="Home"
                style={{width: '20px', transform: 'rotate(-90deg)'}}
              />
              {lang(`home.sections.${currentSection}`)}
              {updateInfo ? (
                <div className="indicator" style={{marginLeft: '8px'}} />
              ) : null}
            </button>
          ) : null}
        </div>
      ) : null}
      <div
        className={classes.title}
        style={{left: '50%', transform: 'translateX(-50%)'}}>
        <span>{lang('global.full-app-name')}</span>
      </div>
      <div className={classes.rightToolbar} style={{right: '12px'}}>
        {extenalAudioFlagEnabled ? <ExternalAuditioning /> : null}
        {termsAccepted ? <DevicePanel /> : null}
      </div>
    </div>
  );
}

export default React.memo(WindowHeader);
