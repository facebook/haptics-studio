/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method */

import {waitFor} from '@testing-library/react';
import {ipcRenderer} from 'electron';

import actions from './actions';
import {createStore, initialValues, RootState} from './store';
import {EnvelopeType, RightPanelSection} from './types';
import baseClipState from '../__mocks__/clipMock';
import {defaultDspSettings, packDspSettings} from './dsp';
import {Tool} from './editingTools/types';

jest.mock('electron', () => ({
  ipcRenderer: {
    send: jest.fn(),
    invoke: jest.fn(),
  },
}));

describe('middleware', () => {
  it('should handle the setRightPanelItem action', () => {
    const store = createStore({
      ...initialValues,
      app: {
        ...initialValues.app,
        rightPanel: {
          item: RightPanelSection.Design,
          width: 300,
        },
      },
      editingTools: {
        ...initialValues.editingTools,
        active: Tool.Pen,
        penData: {clipId: 'clipId', envelope: EnvelopeType.Amplitude},
      },
    });
    store.dispatch(
      actions.app.setRightPanelItem({item: RightPanelSection.Analysis}),
    );
    expect((store.getState() as RootState).editingTools.active).toBe(
      Tool.Cursor,
    );
    expect(
      (store.getState() as RootState).editingTools.penData,
    ).toBeUndefined();
  });

  it('should disable the pen tool when a dialog is open', () => {
    const store = createStore({
      ...initialValues,
      editingTools: {
        ...initialValues.editingTools,
        active: Tool.Pen,
        penData: {clipId: 'clipId', envelope: EnvelopeType.Amplitude},
      },
    });
    store.dispatch(actions.app.showExportDialog({clips: []}));
    expect((store.getState() as RootState).editingTools.active).toBe(
      Tool.Cursor,
    );
    expect(
      (store.getState() as RootState).editingTools.penData,
    ).toBeUndefined();
  });

  describe('when handling updateAudioAnalysis', () => {
    it('should merge the new settings and call the ipc', () => {
      const store = createStore({
        ...initialValues,
        project: {
          ...initialValues.project,
          clips: {
            clip1: baseClipState({}),
          },
        },
      });
      const defaultSettings = defaultDspSettings();
      const packedSettings = packDspSettings({
        ...defaultSettings,
        gain_db: 0.42,
      });
      store.dispatch(
        actions.project.updateAudioAnalysis({
          clipId: 'clip1',
          settingsChange: {gain_db: 0.42},
          group: 'amplitude',
        }),
      );
      expect(ipcRenderer.send).toHaveBeenCalledWith('update_audio_analysis', {
        clipId: 'clip1',
        settings: packedSettings,
        group: 'amplitude',
      });
    });

    it('should switch the active envelope to match the parameter change', async () => {
      const store = createStore({
        ...initialValues,
        project: {
          ...initialValues.project,
          clips: {
            clip1: baseClipState({}),
          },
        },
      });
      store.dispatch(
        actions.project.updateAudioAnalysis({
          clipId: 'clip1',
          settingsChange: {
            frequency_min: 0.42,
            frequency_max: 0.5,
          },
          group: 'frequency',
        }),
      );
      await waitFor(() => {
        expect((store.getState() as RootState).app.visibility.envelope).toBe(
          EnvelopeType.Frequency,
        );
      });
    });
  });

  describe('when handling trimming.commit', () => {
    it('should call the update_trim ipc message', () => {
      const store = createStore({
        ...initialValues,
        project: {
          ...initialValues.project,
          clips: {
            clip1: baseClipState({}),
          },
          currentClipId: 'clip1',
        },
      });

      store.dispatch(
        actions.editingTools.enableTrim({duration: 1, time: 0.42}),
      );
      store.dispatch(actions.editingTools.commitTrim({time: 0.42}));
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('update_trim', {
        clipId: 'clip1',
        trim: 0.42,
      });
    });
  });

  describe('createEmptyClip action', () => {
    it('should enable the pen tool when creating an empty clip', async () => {
      const store = createStore({
        ...initialValues,
      });

      store.dispatch(actions.project.createEmptyClip());
      await waitFor(() => {
        expect((store.getState() as RootState).editingTools.active).toBe(
          Tool.Pen,
        );
      });
    });

    it('should enable the pen tool when creating an empty clip', () => {
      const store = createStore({
        ...initialValues,
      });

      store.dispatch(actions.project.createEmptyClip({clipId: 'clip1'}));
      expect(ipcRenderer.send).toHaveBeenCalledWith('create_empty_clip', {
        clipId: 'clip1',
        name: expect.any(String),
      });
    });
  });
});
