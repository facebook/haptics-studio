/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';

import {render, cleanup, RenderResult} from '../../../test-utils';
import actions from '../../../state/actions';
import clipMock from '../../../__mocks__/clipMock';
import ExportButton from './ExportButton';
import {Clip} from '../../../state/types';

afterEach(cleanup);

const dispatchMock = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => dispatchMock,
}));

const clips = {
  clip1: clipMock({}),
  clip2: clipMock({}),
  clip3: clipMock({}),
};

const renderSubject = (options: {
  clips: Record<string, Clip>;
  select: string[];
}): RenderResult => {
  return render(<ExportButton />, {
    selectors: {
      project: {
        getClips: () => options.clips,
        getClipIds: () => Object.keys(options.clips),
        getSelectedClips: () => options.select,
      },
    },
  });
};

describe('<ExportButton />', () => {
  beforeEach(() => {
    dispatchMock.mockClear();
  });

  it('should present the export dialog on click', () => {
    const element = renderSubject({clips, select: ['clip1', 'clip2']});
    dispatchMock.mockClear();
    element.getByRole('button').click();
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.app.showExportDialog({clips: ['clip1', 'clip2']}),
    );
  });

  it('should be disabled if no clips are selected', () => {
    const element = renderSubject({clips, select: []});
    dispatchMock.mockClear();
    element.getByRole('button').click();
    expect(dispatchMock).not.toHaveBeenCalledWith(
      actions.app.showExportDialog(expect.anything()),
    );
  });
});
