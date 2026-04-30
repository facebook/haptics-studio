/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import React from 'react';

import {render, cleanup, RenderResult, fireEvent} from '../../test-utils';
import EditorToolbar from './EditorToolbar';
import actions from '../../state/actions';
import {EnvelopeType, FocusArea} from '../../../src/state/types';
import {Tool} from '../../state/editingTools/types';

afterEach(cleanup);

const dispatchMock = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => dispatchMock,
}));

const renderSubject = (options: {
  envelope: EnvelopeType;
  activeTool?: Tool;
  currentClipId: string | undefined;
  hasAudioEnvelope?: boolean;
  isPenToolEnabled?: boolean;
}): RenderResult => {
  const {envelope, activeTool = Tool.Cursor, currentClipId} = options;

  return render(<EditorToolbar />, {
    selectors: {
      project: {
        getCurrentClipId: () => currentClipId,
      },
      app: {
        getVisibility: () => ({audio: true, envelope}),
        getFocus: () => FocusArea.Plot,
      },
      editingTools: {
        getActiveTool: () => activeTool,
      },
    },
  });
};

describe('<EditorToolbar />', () => {
  beforeEach(() => {
    dispatchMock.mockClear();
  });

  it('should call the envelope toggle with amplitude when the frequency envelope is visible', () => {
    const subject = renderSubject({
      envelope: EnvelopeType.Frequency,
      currentClipId: 'clipId',
    });
    subject.getByText(/amplitude/i).click();
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.app.setSelectedEnvelope({envelope: EnvelopeType.Amplitude}),
    );
  });

  it('should call the envelope toggle with frequency when the amplitude envelope is visible', () => {
    const subject = renderSubject({
      envelope: EnvelopeType.Amplitude,
      currentClipId: 'clipId',
    });
    subject.getByText(/frequency/i).click();
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.app.setSelectedEnvelope({envelope: EnvelopeType.Frequency}),
    );
  });

  it('should enable the cursor tool when the tool is selected', () => {
    const subject = renderSubject({
      envelope: EnvelopeType.Amplitude,
      activeTool: Tool.Pen,
      currentClipId: 'clipId',
    });
    subject.getByTestId('editor-toolbar-tool-cursor').click();
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.editingTools.enableSelect(),
    );
  });

  it('should enable the pen tool when the tool is selected', () => {
    const subject = renderSubject({
      envelope: EnvelopeType.Amplitude,
      activeTool: Tool.Cursor,
      currentClipId: 'clipId',
    });
    subject.getByTestId('editor-toolbar-tool-pen').click();
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.editingTools.enablePen({
        clipId: 'clipId',
        envelope: EnvelopeType.Amplitude,
      }),
    );
  });

  it('should create an empty clip when the pen is selected on an empty project', () => {
    const subject = renderSubject({
      envelope: EnvelopeType.Amplitude,
      activeTool: Tool.Cursor,
      currentClipId: undefined,
    });
    subject.getByTestId('editor-toolbar-tool-pen').click();
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.project.createEmptyClip({clipId: expect.anything()}),
    );
  });

  it('should enable the marker tool when the tool is selected', () => {
    const subject = renderSubject({
      envelope: EnvelopeType.Amplitude,
      activeTool: Tool.Cursor,
      currentClipId: 'clipId',
    });
    subject.getByTestId('editor-toolbar-tool-markers').click();
    expect(dispatchMock).toHaveBeenCalledWith(
      actions.editingTools.enableMarkers(),
    );
  });

  describe('keyboard shortcuts', () => {
    it('should handle the Escape key, resetting the selection', () => {
      renderSubject({
        envelope: EnvelopeType.Amplitude,
        currentClipId: 'clipId',
      });
      fireEvent.keyDown(window, {key: 'Escape'});
      expect(dispatchMock).toHaveBeenCalledWith(
        actions.project.setSelectedPoints({points: []}),
      );
    });

    it('should handle the Enter key when Pen is enabled', () => {
      renderSubject({
        envelope: EnvelopeType.Amplitude,
        activeTool: Tool.Pen,
        currentClipId: 'clipId',
      });
      fireEvent.keyDown(window, {key: 'Enter'});
      expect(dispatchMock).toHaveBeenCalledWith(
        actions.editingTools.cancelPenEdit(),
      );
    });

    it('should handle the F key, switching envelopes', () => {
      renderSubject({
        envelope: EnvelopeType.Amplitude,
        activeTool: Tool.Pen,
        currentClipId: 'clipId',
      });
      fireEvent.keyDown(window, {key: 'f'});
      expect(dispatchMock).toHaveBeenCalledWith(
        actions.app.setSelectedEnvelope({envelope: EnvelopeType.Frequency}),
      );
    });
  });
});
