/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';

import {render, cleanup} from '../../test-utils';
import ExportDialog from './ExportDialog';
import actions from '../../state/actions';
import {ExportState} from '../../state/app/types';

afterEach(cleanup);

const dispatchMock = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => dispatchMock,
}));
window.localStorage.setItem = jest.fn();

const renderSubject = (options: {
  status?: ExportState;
  formats?: string[];
  flatten?: boolean;
  packageProject?: boolean;
}) => {
  const {
    status = 'none',
    formats = ['haptic'],
    flatten = false,
    packageProject = false,
  } = options;
  return render(<ExportDialog />, {
    selectors: {
      app: {
        getExportDialog: () => ({
          open: true,
          status,
          formats,
          flatten,
          packageProject,
        }),
      },
      project: {
        getSelectedClips: () => [{clipId: 'clip1'}],
      },
    },
  });
};

describe('<ExportDialog />', () => {
  it('should render the export dialog with formats', () => {
    const element = renderSubject({formats: ['haptic']});
    expect(element.getByText('.haptic')).toBeInTheDocument();
  });

  it('should show multiple formats when selected', () => {
    const element = renderSubject({formats: ['haptic', 'ahap', 'wav']});
    expect(element.getByText('.haptic')).toBeInTheDocument();
    expect(element.getByText('.ahap')).toBeInTheDocument();
    expect(element.getByText(/waveform/i)).toBeInTheDocument();
  });

  it('should show package option when enabled', () => {
    const element = renderSubject({
      formats: ['haptic'],
      packageProject: true,
    });
    // Package checkbox should be rendered
    const checkbox = element.container.querySelector('[aria-checked="true"]');
    expect(checkbox).toBeInTheDocument();
  });

  it('should be dismissable', () => {
    const element = renderSubject({});
    element.getByTestId('close-button').click();
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.app.dismissExportDialog(),
    );
  });

  it('should allow the user to view the exported files', () => {
    const element = renderSubject({status: 'success'});
    const viewbutton = element.getByText(/view file/i);
    expect(viewbutton).toBeInTheDocument();
    viewbutton.click();
    expect(dispatchMock).toHaveBeenCalledWith(actions.app.openExportFolder());
  });
});
