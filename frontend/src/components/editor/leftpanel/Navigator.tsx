/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useContext} from 'react';
import {useDispatch} from 'react-redux';

import {DndProvider} from 'react-dnd';
import {HTML5Backend} from 'react-dnd-html5-backend';
import {DropOptions, NodeModel, Tree} from '@minoru/react-dnd-treeview';
import {AppContext} from '../../../containers/App';
import {useKeyboardEvent} from '../../../hooks/useKeyboardEvent';
import {useFocusArea} from '../../../hooks/useFocusArea';
import {useStyles} from './Navigator.styles';
import ContextMenu from '../../common/ContextMenu';
import {Clip, ClipGroup, FocusArea} from '../../../state/types';
import NavigatorGroup from './NavigatorGroup';
import NavigatorClip from './NavigatorClip';
import NavigatorHeader from './NavigatorHeader';

import BugIcon from '../../../images/bug.svg';

const TREE_ROOT = 'ROOT';

/**
 * Left sidebar with the clips navigator
 */
function Navigator(props: {isDragAccept: boolean}) {
  const {isDragAccept} = props;
  const classes = useStyles();
  const dispatch = useDispatch();
  const {actions, selectors, lang} = useContext(AppContext);
  const clips = selectors.project.getClips();
  const currentClipId = selectors.project.getCurrentClipId();
  const selectedClips = selectors.project.getSelectedClips();
  const selection = selectors.project.getSelection();
  const groups = selectors.project.getGroups();
  const clipIds = selectors.project.getClipIds();
  const {focus, setFocus: onNavigatorFocus} = useFocusArea(FocusArea.Navigator);
  const {contextMenu} = selectors.app.getOverlays();
  const areDefaultControlsEnabled = selectors.app.getDefaultControlStatus();
  const isOnWindows = selectors.app.isOnWindows();

  /* Selection */
  const clearSelection = () => {
    if (currentClipId)
      dispatch(
        actions.project.selectClip({
          id: currentClipId,
          add: false,
          range: false,
        }),
      );
  };

  React.useEffect(() => {
    dispatch(
      actions.app.toggleMenuItems({duplicate_clips: selectedClips.length > 0}),
    );
  }, [selectedClips]);

  /* Group & Ungroup */
  const groupEnabled = selectors.project.canGroupClips();
  const ungroupEnabled = selectors.project.canUngroupClips();
  React.useEffect(() => {
    dispatch(
      actions.app.toggleMenuItems({
        group: groupEnabled,
        ungroup: ungroupEnabled,
      }),
    );
  }, [groupEnabled, ungroupEnabled]);

  /* Add Clips */
  const onOpenFiles = () => {
    const properties = isOnWindows ? ['openFile'] : undefined;
    dispatch(actions.project.requestAddFiles({properties}));
  };

  /* Keyboard navigation */
  const keydown = React.useCallback(
    (event: KeyboardEvent) => {
      if (focus !== FocusArea.Navigator) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          dispatch(actions.project.setAndSelectNextClip());
          break;
        case 'ArrowUp':
          event.preventDefault();
          dispatch(actions.project.setAndSelectPreviousClip());
          break;
        case 'Delete':
        case 'Backspace': {
          if (!areDefaultControlsEnabled) {
            dispatch(
              actions.app.showDialog({
                title: lang(
                  `editor.remove-clip${selectedClips.length > 1 ? 's' : ''}`,
                ),
                text: lang(
                  `editor.remove-clip${selectedClips.length > 1 ? 's' : ''}-body`,
                ),
                confirmButton: lang('editor.remove-confirm-button'),
                action: actions.project.deleteClips({clipIds: selectedClips}),
              }),
            );
          }
          break;
        }
        default:
          break;
      }
    },
    [focus, groups, selectedClips],
  );
  useKeyboardEvent('keydown', keydown);

  /* Tree */
  const [isDragging, setIsDragging] = React.useState(false);
  const treeData: NodeModel<ClipGroup | Clip>[] = React.useMemo(() => {
    const data: NodeModel<ClipGroup | Clip>[] = [];
    groups.forEach(g => {
      if (g.isFolder) {
        data.push({
          id: g.id,
          parent: TREE_ROOT,
          text: g.name ?? '',
          droppable: true,
          data: g,
        });
      }
      g.clips.forEach(c => {
        if (clips[c])
          data.push({
            id: c,
            parent: g.isFolder ? g.id : TREE_ROOT,
            text: clips[c].name,
            droppable: true,
            data: clips[c],
          });
      });
    });
    return data;
  }, [clips, groups]);

  const onDragStart = (node: NodeModel<ClipGroup | Clip>) => {
    const {id, data} = node;
    setIsDragging(true);
    if (
      data !== undefined &&
      !selection.clips.includes(id.toString()) &&
      !selection.groups.includes(id.toString())
    ) {
      if ('isFolder' in data)
        dispatch(
          actions.project.selectGroup({
            id: id.toString(),
            add: false,
            range: false,
          }),
        );
      else
        dispatch(
          actions.project.selectClip({
            id: id.toString(),
            add: false,
            range: false,
          }),
        );
    }
  };

  const dropHandle = React.useCallback(
    (
      _tree: NodeModel<Clip | ClipGroup>[],
      options: DropOptions<Clip | ClipGroup>,
    ) => {
      const {dropTarget, relativeIndex} = options;
      dispatch(
        actions.project.moveSelectedClips({
          toGroup: dropTarget?.id?.toString(),
          index: relativeIndex ?? 0,
        }),
      );
    },
    [],
  );

  return (
    <div className={classes.container} onClick={onNavigatorFocus}>
      {contextMenu ? <ContextMenu position={contextMenu} /> : null}

      <NavigatorHeader clipCount={clipIds.length} onNewAudio={onOpenFiles} />

      <DndProvider backend={HTML5Backend} context={window}>
        <div
          className={`scrollbar ${classes.clips} ${clipIds.length === 0 ? 'empty' : ''} ${isDragAccept ? 'drag-over-accept' : ''}`}
          data-testid="navigator">
          <Tree
            tree={treeData}
            rootId={TREE_ROOT}
            sort={false}
            insertDroppableFirst={false}
            initialOpen
            listComponent="div"
            listItemComponent="div"
            placeholderComponent="div"
            classes={{
              root: classes.treeRoot,
              placeholder: classes.placeholderContainer,
            }}
            enableAnimateExpand
            dropTargetOffset={20}
            canDrag={() => true}
            canDrop={(_tree, {dropTarget}) => {
              // We need something to move
              if (selection.clips.length === 0 && selection.groups.length === 0)
                return;
              // If we are moving only clips we can always drop them
              if (selection.groups.length === 0) return true;
              // If we are moving only folders and the drop target is a folder we can't drop them
              if (
                dropTarget?.data &&
                'isFolder' in dropTarget.data &&
                selection.clips.length === 0
              )
                return false;
              // If we are moving folders and clips we can't drop them inside a selected group
              if (
                dropTarget &&
                (selection.groups.includes(dropTarget.parent.toString()) ||
                  selection.groups.includes(dropTarget.id.toString()))
              )
                return false;
              return true;
            }}
            onDrop={dropHandle}
            onDragStart={onDragStart}
            onDragEnd={() => setIsDragging(false)}
            render={(node, params) => {
              const {id, data, parent} = node;
              if (data) {
                const isSelected = selection.groups.includes(id.toString());
                if ('isFolder' in data)
                  return (
                    <NavigatorGroup
                      isSelected={isSelected}
                      group={data}
                      {...params}
                      isDragging={isDragging && isSelected}
                    />
                  );
                else
                  return (
                    <NavigatorClip
                      clip={data}
                      clipId={id.toString()}
                      groupId={
                        node.parent !== TREE_ROOT
                          ? node.parent.toString()
                          : undefined
                      }
                      {...params}
                      isDragging={
                        isDragging &&
                        (selection.clips.includes(id.toString()) ||
                          selection.groups.includes(parent.toString()))
                      }
                    />
                  );
              }
              return <></>;
            }}
            placeholderRender={(_node, {depth}) => (
              <div
                className={classes.placeholder}
                style={{left: depth > 0 ? '30px' : 0}}
              />
            )}
            dragPreviewRender={() => <></>}
            rootProps={{
              onClick: () => clearSelection(),
            }}
          />
        </div>
      </DndProvider>
      <div className={classes.footer}>
        <button
          type="button"
          data-testid="header-bugreport-button"
          className="hsbutton secondary icon borderless dark"
          onClick={() => {
            dispatch(actions.app.showBugReportDialog());
          }}>
          <img
            src={BugIcon}
            alt="Report a bug"
            style={{width: '16px', height: '16px'}}
          />
          {lang('home.bug-report')}
        </button>
      </div>
    </div>
  );
}

export default React.memo(Navigator);
