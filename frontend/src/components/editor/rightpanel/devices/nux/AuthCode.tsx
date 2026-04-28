/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Spinner from '../../../../common/Spinner';
import {AppContext} from '../../../../../containers/App';
import {createAppStyle} from '../../../../../styles/theme.style';

const useStyles = createAppStyle(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  body: {
    width: '100%',
    padding: `${theme.spacing.sm} ${theme.spacing.xxl}`,
  },
  description: {
    width: '100%',
    display: 'flex',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    whiteSpace: 'pre-line',
    ...theme.typography.body,
    marginTop: `-${theme.spacing.sm}`,
  },
  authCode: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    margin: '8px auto 0',
    '& span': {
      margin: 0,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: '20%',
      background: theme.colors.background.body,
      borderRadius: '8px',
      color: theme.colors.text.primary,
      fontWeight: 300,
      textAlign: 'center',
    },
  },
}));

interface Props {
  centered?: boolean;
}

function AuthCode(props: Props) {
  const classes = useStyles();
  const {selectors, lang} = React.useContext(AppContext);
  const {centered} = props;

  const wsAuthCode = selectors.app.getWSAuthCode();

  return (
    <div
      className={classes.container}
      style={{margin: centered ? '24px 0px 8px' : '0px'}}>
      <div
        className={classes.description}
        style={{textAlign: centered ? 'center' : 'left'}}>
        {lang('devices.auth-code-requested')}
      </div>
      <div
        className={classes.body}
        style={{padding: centered ? '8px 24px' : '8px 48px 8px 0'}}>
        {wsAuthCode ? (
          <div className={classes.authCode}>
            {[...wsAuthCode].map((c, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: centered ? '68px' : '60px',
                  lineHeight: centered ? '80px' : '70px',
                }}>
                {c}
              </span>
            ))}
          </div>
        ) : (
          <div style={{display: 'flex', justifyContent: 'center'}}>
            <Spinner size={32} small color="white" margin={10} />
          </div>
        )}
      </div>
    </div>
  );
}

AuthCode.defaultProps = {
  centered: false,
};

export default React.memo(AuthCode);
