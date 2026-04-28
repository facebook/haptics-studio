/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createListenerMiddleware, isAnyOf} from '@reduxjs/toolkit';

import {IpcInvokeChannel} from '../../../../shared';
import {typedInvoke} from '../../../../shared/typed-ipc';
import appSlice from '../app/slice';
import projectSlice from '../project/slice';
import editingToolsSlice from '../editingTools/slice';
import {RightPanelSection} from '../types';
import {RootState} from '../store';

type ListenerMiddleware = ReturnType<typeof createListenerMiddleware>;

export function registerEditingToolsListeners(
  listenerMiddleware: ListenerMiddleware,
): void {
  listenerMiddleware.startListening({
    actionCreator: editingToolsSlice.actions.commitTrim,
    effect: async (action, listenerApi) => {
      const {currentClipId} = (listenerApi.getOriginalState() as RootState)
        .project;
      const {trimData} = (listenerApi.getOriginalState() as RootState)
        .editingTools;

      if (currentClipId) {
        await typedInvoke(IpcInvokeChannel.UpdateTrim, {
          clipId: currentClipId,
          trim: trimData?.time,
        });
      }
    },
  });

  listenerMiddleware.startListening({
    actionCreator: editingToolsSlice.actions.revertTrim,
    effect: async (action, listenerApi) => {
      const {currentClipId} = (listenerApi.getOriginalState() as RootState)
        .project;

      if (currentClipId) {
        await typedInvoke(IpcInvokeChannel.UpdateTrim, {
          clipId: currentClipId,
          trim: undefined,
        });
      }
    },
  });

  // Dismiss the pen tool when switching away from the edit panel
  listenerMiddleware.startListening({
    actionCreator: appSlice.actions.setRightPanelItem,
    effect: (action, listenerApi) => {
      const {penData} = (listenerApi.getOriginalState() as RootState)
        .editingTools;
      if (penData && action.payload.item !== RightPanelSection.Design) {
        listenerApi.dispatch(editingToolsSlice.actions.cancelPenEdit());
      }
    },
  });

  listenerMiddleware.startListening({
    actionCreator: editingToolsSlice.actions.enableSelect,
    effect: (action, listenerApi) => {
      const {penData} = (listenerApi.getOriginalState() as RootState)
        .editingTools;
      if (penData) {
        listenerApi.dispatch(editingToolsSlice.actions.cancelPenEdit());
      }
    },
  });

  listenerMiddleware.startListening({
    matcher: isAnyOf(
      appSlice.actions.toggleDevicePanelState,
      appSlice.actions.showDialog,
      appSlice.actions.showExportDialog,
      appSlice.actions.showBugReportDialog,
      projectSlice.actions.pastePoints,
    ),
    effect: (action, listenerApi) => {
      const {penData} = (listenerApi.getOriginalState() as RootState)
        .editingTools;

      if (penData) {
        listenerApi.dispatch(editingToolsSlice.actions.cancelPenEdit());
      }
      listenerApi.dispatch(editingToolsSlice.actions.enableSelect());
    },
  });

  listenerMiddleware.startListening({
    matcher: isAnyOf(
      projectSlice.actions.analyzeFiles,
      projectSlice.actions.createEmptyClip,
    ),
    effect: (action, listenerApi) => {
      listenerApi.dispatch(projectSlice.actions.cancelPaste());
    },
  });
}
