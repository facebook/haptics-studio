/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {RenderParams, useDragOver} from '@minoru/react-dnd-treeview';
import 'react-circular-progressbar/dist/styles.css';

import {useDispatch} from 'react-redux';
import {ClipGroup, FocusArea} from '../../../state/types';
import {useAppContext} from '../../../containers/App';
import {useStyles} from './Navigator.styles';
import {useFocusArea} from '../../../hooks/useFocusArea';

interface Props extends Partial<RenderParams> {
  group: ClipGroup;
  isSelected: boolean;
}

const NavigatorGroup = (props: Props) => {
  const classes = useStyles();
  const {actions, selectors} = useAppContext();
  const dispatch = useDispatch();
  const {group, isOpen = false, isDragging, isSelected} = props;
  const {setFocus: onNavigatorFocus} = useFocusArea(FocusArea.Navigator);
  const isOnWindows = selectors.app.isOnWindows();

  const dragOverProps = useDragOver(group.id, isOpen, () => props.onToggle?.());

  /* Selection */
  const onGroupSelection = (
    g: ClipGroup,
    e: React.MouseEvent<HTMLDivElement>,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    onNavigatorFocus();

    const modifierKey = isOnWindows ? e.ctrlKey : e.metaKey;
    dispatch(
      actions.project.selectGroup({
        id: g.id,
        add: modifierKey,
        range: e.shiftKey,
      }),
    );
  };

  /* Context Menu */
  const elementRef = React.createRef<HTMLDivElement>();
  const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isSelected) onGroupSelection(group, event);

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

  /* Edit Group name */
  const [isEditing, setIsEditing] = React.useState(false);

  const onRename = (id: string, name: string) => {
    const oldName = group.name;
    if (oldName !== undefined && oldName !== name) {
      dispatch(actions.project.renameClipGroup({id, name}));
      setIsEditing(false);
    } else {
      setIsEditing(false);
    }
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

  /* Group toggle */
  const onGroupToggle = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onNavigatorFocus();
    props.onToggle?.();
  };

  React.useEffect(() => {
    props.onToggle?.();
  }, []);

  return (
    <div
      ref={elementRef}
      key={group.id}
      onContextMenu={handleContextMenu}
      className={`${classes.group} ${isDragging ? classes.draggingSource : ''}`}
      style={isDragging ? {background: 'none'} : {}}
      {...dragOverProps}>
      <span
        className={`${classes.clipHeader} ${isSelected ? classes.selected : ''}`}
        onClick={onGroupSelection.bind(null, group)}
        style={{position: 'relative'}}>
        <span className={classes.icon}>
          <img
            className="accessory"
            style={{width: '18px', height: '18px'}}
            src={require('../../../images/icon-group.svg')}
            alt=""
          />
        </span>
        <span className={classes.name} onDoubleClick={onEditClipName}>
          {isEditing ? (
            <input
              type="text"
              defaultValue={group.name}
              autoFocus
              onBlur={onEditNameBlur.bind(null, group.id)}
              onKeyDown={onEditNameKeyDown.bind(null, group.id)}
              onFocus={e => {
                e.target.select();
              }}
            />
          ) : (
            group.name
          )}
        </span>
        <span
          className={classes.icon}
          style={isOpen ? {transform: 'scaleY(-1)'} : {}}
          onClick={onGroupToggle}>
          <img
            className="accessory"
            src={require('../../../images/group-chevron.svg')}
            alt=""
          />
        </span>
      </span>
    </div>
  );
};

export default React.memo(NavigatorGroup);
