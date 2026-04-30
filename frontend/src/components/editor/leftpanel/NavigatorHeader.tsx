/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useContext} from 'react';
import {useDispatch} from 'react-redux';
import {useTransition, animated} from '@react-spring/web';

import {AppContext} from '../../../containers/App';
import {useStyles as useContextMenuStyles} from '../../common/ContextMenu.styles';
import {useStyles as useNavigatorStyles} from './Navigator.styles';
import {ZIndex} from '../../../styles/zIndex';

import PenIcon from '../../../images/pen-white.svg';
import AudioIcon from '../../../images/audio-haptics.svg';
import {useKeyboardEvent} from '../../../hooks/useKeyboardEvent';

interface Props {
  clipCount: number;
  onNewAudio: () => void;
}

/**
 * Header for the navigator
 */
function NavigatorHeader(props: Props) {
  const classes = useNavigatorStyles();
  const contextMenuClasses = useContextMenuStyles();
  const dispatch = useDispatch();
  const {actions, lang, selectors} = useContext(AppContext);
  const project = selectors.project.getProjectInfo();
  const windowInfo = selectors.app.getWindowInformation();

  const [showMenu, setShowMenu] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const onKeyPress = (event: KeyboardEvent) => {
    if (props.clipCount === 0) return;
    const modifierKey = windowInfo.isOnWindows ? event.ctrlKey : event.metaKey;
    if (event.key === 'n' && modifierKey) {
      setShowMenu(true);
    }
    if (event.key === 'Escape') {
      setShowMenu(false);
    }
    if (showMenu) {
      if (event.key === 'a' && !event.metaKey && !event.ctrlKey) {
        props.onNewAudio();
        setShowMenu(false);
      }
      if (event.key === 'd' && !event.metaKey && !event.ctrlKey) {
        onEmptyClip();
        setShowMenu(false);
      }
    }
  };
  useKeyboardEvent('keydown', onKeyPress);

  const onDismiss = () => {
    setShowMenu(false);
  };

  const onEmptyClip = () => {
    dispatch(actions.project.createEmptyClip());
    setShowMenu(false);
  };

  const transitions = useTransition(showMenu, {
    from: {opacity: 0},
    enter: {opacity: 1},
  });

  const onEditNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();

    if (e.key === 'Enter') {
      void onRenameProject(e.currentTarget.value);
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const onRenameProject = (name: string) => {
    setIsSaving(true);
    if (name !== project.name) {
      dispatch(actions.project.renameProject({name}));
    }
    setIsEditing(false);
    setIsSaving(false);
  };

  const onEditNameBlur = () => {
    if (!isSaving) setIsEditing(false);
  };

  const onEditProjectName = () => {
    if (
      (!project.isSample && !project.isTutorial) ||
      windowInfo.isCurrentProjectDirty
    )
      setIsEditing(true);
  };

  const projectName = !project.isTutorial
    ? windowInfo.projectName
    : project.name?.replace(/_/g, ' ');

  const titleView = isEditing ? (
    <input
      type="text"
      defaultValue={windowInfo.projectName ?? ''}
      autoFocus
      onBlur={onEditNameBlur}
      onKeyDown={onEditNameKeyDown}
      onFocus={e => {
        e.target.select();
      }}
    />
  ) : (
    <span onDoubleClick={() => onEditProjectName()}>{projectName}</span>
  );

  return (
    <div className={classes.navigatorHeader}>
      {windowInfo.isCurrentProjectDirty ? (
        <div className={classes.dirty} />
      ) : null}
      {titleView}
      {props.clipCount !== 0 ? (
        <button
          type="button"
          className="hsbutton icon secondary borderless"
          onClick={() => setShowMenu(true)}>
          <img src={require('../../../images/icon-add-circle.svg')} />
          {props.clipCount === 0 ? lang('projects.action-add-clip') : ''}
        </button>
      ) : null}
      {showMenu
        ? transitions(style => (
            <animated.div
              style={{...style, zIndex: ZIndex.Menu}}
              className={contextMenuClasses.background}
              onClick={onDismiss}
              onContextMenu={onDismiss}>
              <div
                data-tesdtid="new-clip-menu"
                className={contextMenuClasses.menu}
                style={{
                  top: 100,
                  bottom: 'unset',
                  left: 52,
                  right: 'unset',
                  width: 220,
                }}>
                <span className="left" onClick={props.onNewAudio}>
                  <img src={AudioIcon} /> {lang('editor.new-clip-audio')}
                  <aside>A</aside>
                </span>
                <span className="left" onClick={onEmptyClip}>
                  <img src={PenIcon} /> {lang('editor.new-clip-draw')}
                  <aside>D</aside>
                </span>
              </div>
            </animated.div>
          ))
        : null}
    </div>
  );
}

export default React.memo(NavigatorHeader);
