/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';
import {AnyAction} from 'redux';

import {render, cleanup, RenderResult, fireEvent} from '../../test-utils';
import Dialog from './Dialog';
import actions from '../../state/actions';

afterEach(cleanup);

const dispatchMock = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => dispatchMock,
}));
window.localStorage.setItem = jest.fn();

const renderSubject = (action?: AnyAction): RenderResult => {
  return render(
    <Dialog
      dialog={{
        visible: true,
        title: 'Dialog Title',
        text: 'Some text',
        confirmButton: 'Confirm',
        action,
      }}
    />,
    {},
  );
};

describe('<Dialog />', () => {
  afterEach(() => {
    dispatchMock.mockClear();
  });

  it('should render the content', () => {
    const element = renderSubject();
    expect(element).toMatchSnapshot();
    expect(element.getByText('Dialog Title')).toBeInTheDocument();
    expect(element.getByText('Some text')).toBeInTheDocument();
    expect(element.getByText('Confirm')).toBeInTheDocument();
  });

  it('should be dismissable', () => {
    const element = renderSubject();
    element.getByText('Cancel').click();
    expect(dispatchMock).toHaveBeenCalledWith(actions.app.dismissDialog());
  });

  it('should call the action upon confirm', () => {
    const action = actions.project.updateAudioAnalysis({
      clipId: 'clip1',
      settingsChange: {},
      group: 'amplitude',
    });
    const element = renderSubject(action);
    element.getByText('Confirm').click();
    expect(dispatchMock).toHaveBeenCalledWith(actions.app.dismissDialog());
    expect(dispatchMock).toHaveBeenCalledWith(action);
  });

  it('should confirm the action with Enter', () => {
    const action = actions.project.deleteClips({clipIds: ['clipId1']});
    const element = renderSubject(action);
    fireEvent.keyDown(element.baseElement, {key: 'Enter'});
    expect(dispatchMock).toHaveBeenCalledWith(actions.app.dismissDialog());
    expect(dispatchMock).toHaveBeenCalledWith(action);
  });

  it('should be dismissed with Escape', () => {
    const element = renderSubject();
    fireEvent.keyDown(element.baseElement, {key: 'Escape'});
    expect(dispatchMock).toHaveBeenCalledWith(actions.app.dismissDialog());
  });
});
