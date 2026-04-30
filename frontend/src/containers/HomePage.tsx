/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useCallback, useContext, useEffect} from 'react';
import {useDispatch} from 'react-redux';
import Landing from '../components/home/Landing';
import {AppContext} from './App';
import EditorUI from '../components/editor/EditorUI';
import {useKeyboardEvent} from '../hooks/useKeyboardEvent';
import useMessageListener from '../hooks/useMessageListener';
import {FocusArea} from '../state/types';
import Dialogs from './Dialogs';

/**
 * Entry point that mounts the main UI components
 */
function HomePage() {
  const dispatch = useDispatch();
  const {actions, selectors} = useContext(AppContext);
  const currentClipId = selectors.project.getCurrentClipId();
  const project = selectors.project.getProjectInfo();
  const focus = selectors.app.getFocus();
  const isOnWindows = selectors.app.isOnWindows();

  useMessageListener();

  useEffect(() => {
    dispatch(actions.project.loadCurrentProject());
    dispatch(actions.app.loadSamples());
    dispatch(actions.app.toggleEmphasisMenu({checked: false, enabled: false}));
    dispatch(actions.app.toggleCopyMenu({enabled: false}));
  }, []);

  const keyDown = useCallback(
    (e: KeyboardEvent) => {
      const useDefaultActions = !isOnWindows;
      if (!useDefaultActions) {
        const key = e.key.toLowerCase();
        if (key === 'c' && e.ctrlKey) {
          dispatch(
            actions.project.copySelectedPoints({
              clipId: currentClipId,
              cut: false,
            }),
          );
        }
        if (key === 'x' && e.ctrlKey) {
          dispatch(
            actions.project.copySelectedPoints({
              clipId: currentClipId,
              cut: true,
            }),
          );
        }
        if (key === 'v' && e.ctrlKey) {
          dispatch(actions.project.requestPaste());
        }
        if (key === 'a' && e.ctrlKey) {
          e.preventDefault();
          dispatch(actions.project.selectAll());
        }
      }
    },
    [currentClipId],
  );
  useKeyboardEvent('keydown', keyDown);

  // Update the application menu based on the current project state
  React.useEffect(() => {
    dispatch(
      actions.app.toggleMenuItems({
        select_all:
          project.isOpen &&
          ((focus === FocusArea.Navigator && !project.isTutorial) ||
            focus === FocusArea.Plot),
      }),
    );
  }, [project.isOpen, focus]);

  return (
    <div>
      <Dialogs />

      <div>{project.isOpen ? <EditorUI /> : <Landing />}</div>
    </div>
  );
}

export default React.memo(HomePage);
