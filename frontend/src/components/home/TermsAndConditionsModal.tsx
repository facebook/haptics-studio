/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {shell} from 'electron';
import React, {useContext} from 'react';
import {useDispatch} from 'react-redux';

import {AppContext} from '../../containers/App';
import {createAppStyle} from '../../styles/theme.style';
import {ZIndex} from '../../styles/zIndex';

import TermsImage from '../../images/terms-and-conditions.png';

const useStyles = createAppStyle(theme => ({
  container: {
    position: 'absolute',
    zIndex: ZIndex.TopLevel,
    top: theme.sizes.windowHeaderHeight,
    left: 0,
    bottom: 0,
    right: 0,
    height: `calc(100vh - ${theme.sizes.windowHeaderHeight})`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.dark,
  },
  background: {
    margin: '0 16px 16px',
    flex: 1,
    position: 'relative',
    width: 'calc(100% - 32px)',
    height: '100%',
    overflow: 'hidden',
    borderRadius: theme.sizes.borderRadius.card,
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    flex: 1,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: '4% 4% 2% 6%',
    background:
      'linear-gradient(150deg,  rgba(0,0,0,0.8) 0%,rgba(0,0,0,0) 80%,rgba(0,0,0,0.1) 100%)',

    '& > img': {
      marginLeft: '-18px',
      width: '120px',
      height: 'auto',
    },
    '& h2': {
      fontWeight: '500',
      fontSize: '48px',
      lineHeight: '56px',
      letterSpacing: '0.36px',
      marginBottom: '0px',
      marginTop: '0px',

      color: '#FFFFFF',
    },
  },
  termsContainer: {
    alignSelf: 'flex-end',
    borderRadius: theme.sizes.borderRadius.card,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    width: '36%',
    margin: '2% 0%',
    padding: '32px 32px 40px',
    background: 'rgba(50, 52, 54, 0.5)',
    border: `1px solid ${theme.colors.background.tag}`,
    backdropFilter: 'blur(24px)',

    '& h3': {
      fontWeight: 600,
      fontSize: '28px',
      lineHeight: '32px',
      textAlign: 'center',
      color: theme.colors.text.pressed,
      margin: 0,
    },
    '& span': {
      fontWeight: 300,
      fontSize: '14px',
      lineHeight: '24px',
      textAlign: 'center',
      color: theme.colors.text.primary,
      whiteSpace: 'pre-line',
      '&.link': {
        color: theme.colors.text.pressed,
      },
    },
  },
  buttonsContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.lg,
  },
}));

function TermsAndConditionsModal() {
  const {lang, actions} = useContext(AppContext);
  const classes = useStyles();
  const dispatch = useDispatch();

  const onAccept = () => {
    dispatch(
      actions.app.updateTermsAndConditionsApprove({termsAccepted: true}),
    );
  };

  const onReject = () => {
    dispatch(actions.app.quitApplication());
  };

  const onLinkClick = (url: string) => {
    void shell.openExternal(url);
  };

  return (
    <div className={classes.container}>
      <div className={classes.background}>
        <img
          className={classes.image}
          src={TermsImage}
          alt="Terms and Conditions"
        />
        <div className={classes.content}>
          <h2>{lang('global.app-name')}</h2>
          <div style={{flex: 1}} />
          <div className={classes.termsContainer}>
            <h3>{lang('global.terms-and-conditions.title')}</h3>
            <span>
              <span>
                {lang('global.terms-and-conditions.content-before-link')}
              </span>
              <span
                className="link"
                onClick={() =>
                  onLinkClick('https://developer.oculus.com/licenses/oculussdk')
                }>
                {lang('global.terms-and-conditions.content-link')}
              </span>
              <span>
                {lang('global.terms-and-conditions.content-after-link')}
              </span>
            </span>
            <div className={classes.buttonsContainer}>
              <button
                type="button"
                className="hsbutton secondary"
                style={{minWidth: '110px'}}
                onClick={() => onReject()}>
                {lang('global.terms-and-conditions.action-reject')}
              </button>
              <button
                type="button"
                className="hsbutton"
                style={{minWidth: '110px'}}
                onClick={() => onAccept()}>
                {lang('global.terms-and-conditions.action-agree')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(TermsAndConditionsModal);
