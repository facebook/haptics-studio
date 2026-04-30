/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useContext} from 'react';
import 'react-circular-progressbar/dist/styles.css';

import {useDispatch} from 'react-redux';
import {RenderParams} from '@minoru/react-dnd-treeview';
import {AppContext} from '../../../containers/App';
import {useStyles} from './Navigator.styles';
import {Clip, FocusArea} from '../../../state/types';
import {useFocusArea} from '../../../hooks/useFocusArea';
import Spinner from '../../common/Spinner';

import IconAudio from '../../../images/icon-audio.svg';
import IconFreeform from '../../../images/icon-freeform.svg';
import IconStereo from '../../../images/icon-stereo.svg';
import IconLeft from '../../../images/icon-audio-left.svg';
import IconRight from '../../../images/icon-audio-right.svg';

interface Props extends Partial<RenderParams> {
  clip: Clip;
  clipId: string;
  groupId?: string;
}

function NavigatorClip(props: Props) {
  const {clip, clipId, groupId, depth = 0, isDragging} = props;
  const classes = useStyles();
  const dispatch = useDispatch();
  const {actions, selectors} = useContext(AppContext);
  const selection = selectors.project.getSelection();
  const {setFocus: onNavigatorFocus} = useFocusArea(FocusArea.Navigator);
  const isOnWindows = selectors.app.isOnWindows();

  /* Clip selection */
  const isGroupSelected = groupId ? selection.groups.includes(groupId) : false;
  const isSelected = selection.clips.includes(clipId) || isGroupSelected;
  const onClipSelection = (
    clipId: string,
    e: React.MouseEvent<HTMLDivElement>,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    onNavigatorFocus();

    const modifierKey = isOnWindows ? e.ctrlKey : e.metaKey;
    if (!e.shiftKey && !modifierKey) {
      dispatch(actions.project.setCurrentClip({id: clipId}));
    } else {
      dispatch(
        actions.project.selectClip({
          id: clipId,
          add: modifierKey,
          range: e.shiftKey,
        }),
      );
    }
  };

  /* Context Menu */
  const elementRef = React.createRef<HTMLDivElement>();
  const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isSelected) onClipSelection(clipId, event);

    if (!elementRef.current) return;
    const bounds = elementRef.current.getBoundingClientRect();
    if (
      event.clientX < bounds.right &&
      event.clientX > bounds.left &&
      event.clientY > bounds.top &&
      event.clientY < bounds.bottom
    ) {
      dispatch(
        actions.app.showContextMenu({
          position: {x: event.clientX, y: event.clientY},
        }),
      );
    }
  };

  /* Edit Clip name */
  const [isEditing, setIsEditing] = React.useState(false);

  const onRename = (id: string, name: string) => {
    const oldName = clip?.name;
    if (oldName !== undefined && oldName !== name) {
      dispatch(actions.project.renameClip({clipId: id, name}));
    }
    setIsEditing(false);
  };

  const onEditNameKeyDown = (
    id: string,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    e.stopPropagation();

    if (e.key === 'Enter') {
      onRename(id, e.currentTarget.value);
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const onEditNameBlur = (id: string, e: React.FormEvent<HTMLInputElement>) => {
    onRename(id, e.currentTarget.value);
  };

  const onEditClipName = (e: React.MouseEvent<HTMLDivElement>) => {
    const modifierKey = isOnWindows ? e.ctrlKey : e.metaKey;
    if (modifierKey || e.shiftKey) return;
    if (!isEditing) setIsEditing(true);
  };

  const accessory = React.useMemo(() => {
    let view = null;
    if (clip.loading) {
      view = <Spinner size={16} color="white" />;
    } else {
      if (clip.failed) {
        view = (
          <span className={classes.warning}>
            <img src={require('../../../images/icon-error.svg')} />
          </span>
        );
      }
      if (!clip.audio?.exists && clip.audio?.path) {
        view = (
          <span className={classes.warning}>
            <img src={require('../../../images/icon-warning.svg')} />
          </span>
        );
      }
    }
    return view;
  }, [clip]);

  let iconName = clip.audio?.path ? IconAudio : IconFreeform;
  if (clip.name.endsWith('_L')) iconName = IconLeft;
  if (clip.name.endsWith('_R')) iconName = IconRight;
  if (clip.audio?.channels === 2) iconName = IconStereo;

  return (
    <div
      ref={elementRef}
      key={`item-${clipId}`}
      className={isDragging ? classes.draggingSource : ''}
      style={{position: 'relative'}}
      onContextMenu={handleContextMenu}>
      <span
        onClick={onClipSelection.bind(null, clipId)}
        className={`${classes.clip} ${isSelected ? classes.selected : ''} ${isGroupSelected ? 'child' : ''}`}>
        {depth > 0 ? <span className={classes.nesting} /> : null}
        <span className={classes.icon}>
          <img
            className="accessory"
            style={{width: '18px', height: '18px'}}
            src={iconName}
            alt=""
          />
        </span>
        <span
          data-testid="clip"
          className={classes.name}
          onDoubleClick={onEditClipName}>
          {isEditing ? (
            <input
              className={classes.inputText}
              type="text"
              defaultValue={clip.name}
              autoFocus
              onBlur={onEditNameBlur.bind(null, clipId)}
              onKeyDown={onEditNameKeyDown.bind(null, clipId)}
              onFocus={e => {
                e.target.select();
              }}
            />
          ) : (
            clip.name
          )}
        </span>
        {accessory ? <span className={classes.icon}>{accessory}</span> : null}
      </span>
    </div>
  );
}

NavigatorClip.defaultProps = {
  groupId: undefined,
};

export default React.memo(NavigatorClip);
