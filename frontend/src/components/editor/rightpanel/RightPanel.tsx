/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useCallback, useContext, useState} from 'react';
import {useDispatch} from 'react-redux';
import Constants from '../../../globals/constants';
import {AppContext} from '../../../containers/App';
import {createAppStyle} from '../../../styles/theme.style';
import {ZIndex} from '../../../styles/zIndex';
import {useMouseEvent} from '../../../hooks/useMouseEvent';
import {useFocusArea} from '../../../hooks/useFocusArea';
import AudioAnalyser from './AudioAnalyzer';
import Markers from './Markers';
import DetailEditing from './DetailEditing';
import {FocusArea, RightPanelSection} from '../../../state/types';
import TutorialEditor from '../../tutorial/TutorialEditor';
import {useKeyboardEvent} from '../../../hooks/useKeyboardEvent';
import TrimTool from './TrimTool';
import AudioFile from './AudioFile';
import {Tool} from '../../../state/editingTools/types';
import ExportButton from './ExportButton';
import ExportDialog from '../../common/ExportDialog';
import {useRightPanelTabSelection} from '../../../hooks/useRightPanelTabSelection';

const useStyles = createAppStyle(theme => ({
  container: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    zIndex: ZIndex.Panel,
    maxHeight: '100%',
    borderLeft: `1px solid ${theme.colors.background.light}`,
  },
  content: {
    height: '100%',
    maxHeight: '100%',
    background: theme.colors.background.dark,
    borderTopRightRadius: theme.sizes.borderRadius.card,
    borderBottomRightRadius: theme.sizes.borderRadius.card,
    borderLeft: `1px solid ${theme.colors.background.dark}`,
  },
  handle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '0px',
    width: '5px',
    cursor: 'ew-resize',
  },
  tabContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    height: '40px',
    boxShadow: `inset 0px -2px 0px ${theme.colors.tabs.border}`,
  },
  tab: {
    width: '33.3%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    fontSize: '12px',
    lineHeight: '20px',
    fontWeight: 600,
    color: theme.colors.text.secondary,
    opacity: 0.6,
    transition: 'all .15s',
    '&:hover': {
      opacity: 1,
      color: theme.colors.text.primary,
    },
    '&.selected': {
      opacity: 1,
      fontWeight: 600,
      color: theme.colors.text.pressed,
      boxShadow: 'inset 0px -2px 0px white',
      '& div': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      },
    },
  },
  warning: {
    position: 'absolute',
    top: '8px',
    right: '0px',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: theme.colors.accent.yellow,
  },
  footer: {
    height: `${Constants.timeline.height}px`,
    flexShrink: 0,
    borderTop: `1px solid ${theme.colors.background.dark}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
  },
}));

interface Tab {
  type: RightPanelSection;
  visible: boolean;
}

/**
 * Right panel container
 */
function RightPanel() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const {lang, selectors, actions} = useContext(AppContext);
  const [isMovingHandle, setIsMovingHandle] = useState(false);

  const {isAuthoringTutorial} = selectors.project.getProjectInfo();
  const clipIds = selectors.project.getClipIds();
  const currentClipId = selectors.project.getCurrentClipId();
  const currentClip = selectors.project.getCurrentClip();
  const {isSample, isTutorial} = selectors.project.getProjectInfo();
  const areDefaultControlsEnabled = selectors.app.getDefaultControlStatus();
  const {setFocus: onFocus} = useFocusArea(FocusArea.RightPanel);
  const sidePanelWidth = selectors.app.getSidePanelWidth('right');
  const activeItem = selectors.app.getRightPanelItem();
  const selectedBreakpoints =
    selectors.project.getCurrentClip()?.state?.present?.selectedPoints;
  const activeTool = selectors.editingTools.getActiveTool();
  const showBreakpointsEditor =
    Boolean(selectedBreakpoints?.length) || activeTool === Tool.Pen;
  const showExportDialog = selectors.app.getExportDialog();

  const audioMissing = Boolean(
    currentClip &&
      currentClip.audio !== undefined &&
      currentClip.audio.path &&
      !currentClip.audio.exists,
  );

  const onMouseMove = useCallback(
    (event: MouseEvent) => {
      if (isMovingHandle && event.view) {
        const pos = event.view.window.innerWidth - event.clientX;
        dispatch(actions.app.setSidePanelWidth({width: pos, side: 'right'}));
      }
    },
    [isMovingHandle],
  );

  useMouseEvent('mousemove', onMouseMove);

  const onMouseUp = useCallback(() => {
    setIsMovingHandle(false);
  }, []);
  useMouseEvent('mouseleave', onMouseUp);
  useMouseEvent('mouseup', onMouseUp);

  const keyDown = useCallback(
    (e: KeyboardEvent) => {
      if (areDefaultControlsEnabled || e.shiftKey || e.metaKey || e.ctrlKey)
        return;

      switch (e.key) {
        case 'a':
          e.preventDefault();
          if (currentClip?.audio?.path) {
            dispatch(
              actions.app.setRightPanelItem({item: RightPanelSection.Analysis}),
            );
          }
          break;
        case 'd':
          e.preventDefault();
          dispatch(
            actions.app.setRightPanelItem({item: RightPanelSection.Design}),
          );
          break;
        case 'm':
          if (currentClipId) {
            e.preventDefault();
            dispatch(
              actions.app.setRightPanelItem({item: RightPanelSection.Markers}),
            );
          }
          break;
        case 't':
          if (isAuthoringTutorial) {
            e.preventDefault();
            dispatch(
              actions.app.setRightPanelItem({
                item: RightPanelSection.TutorialEditor,
              }),
            );
          }
          break;
        default:
          break;
      }
    },
    [
      currentClipId,
      isAuthoringTutorial,
      areDefaultControlsEnabled,
      currentClip,
    ],
  );
  useKeyboardEvent('keydown', keyDown);

  // Use the custom hook for tab selection logic
  useRightPanelTabSelection({
    currentClip,
    selectedBreakpoints,
    clipIds,
    currentClipId,
    setRightPanelItem: actions.app.setRightPanelItem,
  });

  const tabs: Tab[] = React.useMemo(() => {
    const hasAudio = currentClip && currentClip.audio && currentClip.audio.path;
    return [
      {
        type: RightPanelSection.Design,
        visible: !currentClip || currentClip?.failed === false,
      },
      {
        type: RightPanelSection.Analysis,
        visible: Boolean(currentClip && (hasAudio || currentClip?.failed)),
      },
      {
        type: RightPanelSection.Markers,
        visible: Boolean(currentClip && currentClip?.failed === false),
      },
      {type: RightPanelSection.TutorialEditor, visible: isAuthoringTutorial},
    ];
  }, [currentClipId, currentClip, isAuthoringTutorial]);

  // Enable menu item add marker
  React.useEffect(() => {
    dispatch(
      actions.app.toggleMenuItems({
        add_marker: Boolean(clipIds.length > 0 && currentClipId),
      }),
    );
  }, [clipIds, currentClipId]);

  let content = null;
  switch (activeItem) {
    case RightPanelSection.Markers: {
      content = <Markers />;
      break;
    }
    case RightPanelSection.TutorialEditor: {
      content = <TutorialEditor />;
      break;
    }
    case RightPanelSection.Design: {
      content = (
        <>
          {showBreakpointsEditor ? <DetailEditing /> : null}
          {currentClip ? <TrimTool /> : null}
          {currentClip ? (
            <AudioFile hideActionButton={isSample || isTutorial} />
          ) : null}
        </>
      );
      break;
    }
    case RightPanelSection.Analysis:
    default: {
      content = <AudioAnalyser />;
      break;
    }
  }

  return (
    <div
      className={classes.container}
      style={{
        minWidth: Constants.panels.sidePanelMinWidth,
        width: `${sidePanelWidth}px`,
        gap: '8px',
      }}
      onClick={onFocus}>
      <div className={classes.content}>
        <div
          className={classes.handle}
          onMouseDown={() => setIsMovingHandle(true)}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            maxHeight: '100%',
            minHeight: '100%',
          }}>
          <div className={classes.tabContainer}>
            {tabs
              .filter(t => t.visible)
              .map(item => (
                <span
                  key={item.type}
                  role="button"
                  className={`${classes.tab} ${activeItem === item.type ? 'selected' : ''}`}
                  onClick={() =>
                    dispatch(actions.app.setRightPanelItem({item: item.type}))
                  }>
                  <div>{lang(`editor.tool-tabs.${item.type.toString()}`)}</div>
                  {item.type === RightPanelSection.Design && audioMissing ? (
                    <span className={classes.warning} />
                  ) : null}
                </span>
              ))}
          </div>
          <div
            className="scrollbar"
            style={{flex: '1 1 100%', overflowY: 'auto'}}>
            {content}
          </div>
          {showExportDialog.open ? <ExportDialog /> : null}
          <aside className={classes.footer}>
            <ExportButton />
          </aside>
        </div>
      </div>
    </div>
  );
}

export default React.memo(RightPanel);
