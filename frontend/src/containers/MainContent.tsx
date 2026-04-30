/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useContext, useEffect} from 'react';
import {useDispatch} from 'react-redux';

import {AppContext} from './App';
import TermsAndConditionsModal from '../components/home/TermsAndConditionsModal';
import HomePage from './HomePage';
import useActiveInput from '../hooks/useActiveInput';

function MainContent() {
  const {selectors, actions} = useContext(AppContext);
  const termsAccepted = selectors.app.areTermsAccepted();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(actions.app.getTelemetryState());
  }, []);

  useActiveInput(
    () => {
      dispatch(actions.app.toggleDefaultControls({enabled: true}));
    },
    () => {
      dispatch(actions.app.toggleDefaultControls({enabled: false}));
    },
  );

  return termsAccepted ? <HomePage /> : <TermsAndConditionsModal />;
}

export default React.memo(MainContent);
