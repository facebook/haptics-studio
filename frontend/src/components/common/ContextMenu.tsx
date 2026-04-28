/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useContext} from 'react';
import {useDispatch} from 'react-redux';
import {useTransition, animated} from '@react-spring/web';
import {AppContext} from '../../containers/App';
import {ContextMenuPosition} from '../../state/types';
import {useStyles} from './ContextMenu.styles';
import {ZIndex} from '../../styles/zIndex';

interface ContextMenuProps {
  position: ContextMenuPosition;
}

/**
 * Context menu for the Navigator component
 */
export default function ContextMenu(props: ContextMenuProps): JSX.Element {
  const classes = useStyles();
  const dispatch = useDispatch();
  const {position} = props;
  const {actions, selectors, lang} = useContext(AppContext);
  const currentClipId = selectors.project.getCurrentClipId();
  const currentClip = selectors.project.getCurrentClip();
  const selectedClips = selectors.project.getSelectedClips();
  const {isSample} = selectors.project.getProjectInfo();
  const windowInfo = selectors.app.getWindowInformation();
  const isOnWindows = selectors.app.isOnWindows();

  const onDismiss = () => {
    dispatch(actions.app.dismissContextMenu());
  };

  const onGroup = () => {
    dispatch(actions.project.groupSelectedClips());
    dispatch(actions.app.dismissContextMenu());
  };

  const onUngroup = () => {
    dispatch(actions.project.ungroupSelectedClips());
    dispatch(actions.app.dismissContextMenu());
  };

  const onDelete = () => {
    dispatch(
      actions.app.showDialog({
        title: lang(`editor.remove-clip${selectedClips.length > 1 ? 's' : ''}`),
        text: lang(
          `editor.remove-clip${selectedClips.length > 1 ? 's' : ''}-body`,
        ),
        confirmButton: lang('editor.remove-confirm-button'),
        action: actions.project.deleteClips({clipIds: selectedClips}),
      }),
    );
    dispatch(actions.app.dismissContextMenu());
  };

  const onDuplicate = () => {
    dispatch(actions.project.duplicateSelectedClip());
    dispatch(actions.app.dismissContextMenu());
  };

  const onSplitChannels = () => {
    if (currentClip !== undefined) {
      dispatch(actions.project.splitStereoAudio({clipId: currentClipId ?? ''}));
    }
    dispatch(actions.app.dismissContextMenu());
  };

  const onAudioRelocate = () => {
    if (currentClipId) {
      dispatch(actions.project.requestRelocateAsset({clipId: currentClipId}));
    }
    dispatch(actions.app.dismissContextMenu());
  };

  const groupEnabled = selectors.project.canGroupClips();
  const ungroupEnabled = selectors.project.canUngroupClips();
  const deleteEnabled = selectedClips.length > 0;
  const duplicateEnabled = selectedClips.length > 0;

  let shortcut = 'Ctrl';
  if (!isOnWindows) {
    shortcut = '⌘';
  }

  const transitions = useTransition(position, {
    from: {opacity: 0},
    enter: {opacity: 1},
  });

  const swapHor = position.x + 200 > windowInfo.size[0];
  const swapVer = position.y > (windowInfo.size[1] * 60) / 100;

  return transitions(style => (
    <animated.div style={{...style, zIndex: ZIndex.Menu}}>
      <div
        className={classes.background}
        onClick={onDismiss}
        onContextMenu={onDismiss}
        data-tesdtid="context-menu">
        <div
          className={classes.menu}
          style={{
            top: swapVer ? 'unset' : position.y,
            bottom: swapVer ? windowInfo.size[1] - position.y : 'unset',
            left: swapHor ? 'unset' : position.x,
            right: swapHor ? windowInfo.size[0] - position.x : 'unset',
          }}>
          <span
            className={groupEnabled ? '' : classes.disabled}
            onClick={groupEnabled ? onGroup : undefined}>
            {lang('editor.group')}
            <aside>{`${shortcut}G`}</aside>
          </span>
          <span
            className={ungroupEnabled ? '' : classes.disabled}
            onClick={ungroupEnabled ? onUngroup : undefined}>
            {lang('editor.ungroup')}
            <aside>{`${shortcut}⇧G`}</aside>
          </span>
          <span
            className={duplicateEnabled ? '' : classes.disabled}
            onClick={duplicateEnabled ? onDuplicate : undefined}>
            {lang('editor.duplicate')}
            <aside>{`${shortcut}D`}</aside>
          </span>
          {!currentClip?.audio?.exists && currentClip?.audio?.path ? (
            <span onClick={onAudioRelocate}>
              {lang('editor.missing-file-button')}
            </span>
          ) : null}
          {!isSample &&
          currentClip?.audio?.exists &&
          currentClip?.audio?.path &&
          currentClip?.audio?.channels === 2 ? (
            <span onClick={onSplitChannels}>Split channels</span>
          ) : null}
          <div className={classes.separator} />
          <span
            className={deleteEnabled ? '' : classes.disabled}
            onClick={deleteEnabled ? onDelete : undefined}>
            {lang('editor.delete')}
          </span>
        </div>
      </div>
    </animated.div>
  ));
}
