/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useContext, useEffect} from 'react';
import {useDispatch} from 'react-redux';
import {MainToRenderer, IpcInvokeChannel} from '../../../../shared';
import {
  typedOn,
  typedRemoveAllListeners,
  typedInvoke,
} from '../../../../shared/typed-ipc';
import {CircularProgressbar} from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

import {AppContext} from '../../containers/App';
import {useKeyboardEvent} from '../../hooks/useKeyboardEvent';
import {useFocusArea} from '../../hooks/useFocusArea';
import {ClipHeight, useStyles} from '../editor/leftpanel/Navigator.styles';
import {ClipGroup, FocusArea} from '../../state/types';
import TutorialStepsViewer from './TutorialStepsViewer';
import useTutorialStorage from '../../hooks/useTutorialStorage';
import {theme} from '../../styles/theme.style';
import {TutorialPageSeparator} from '../../globals/constants';

/**
 * Left sidebar with the clips navigator
 */
function TutorialNavigator() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const {actions, selectors, lang} = useContext(AppContext);
  const currentClipId = selectors.project.getCurrentClipId();
  const sessionId = selectors.project.getSessionId();
  const {slug, isTutorial, version} = selectors.project.getProjectInfo();
  const {isClipCompleted, setClipComplete, getCompletedClipsCount} =
    useTutorialStorage(slug ?? sessionId ?? '', !isTutorial);
  const groups = selectors.project.getGroups();
  const {focus, setFocus: onNavigatorFocus} = useFocusArea(FocusArea.Navigator);
  const clips = selectors.project.getClips();
  const clipIds = selectors.project.getClipIds();
  const isOnWindows = selectors.app.isOnWindows();
  const clipContainerRef = React.useRef<HTMLDivElement>(null);
  const selectedClipRef = React.useRef<HTMLDivElement>(null);
  const [emptySpaceHeight, setEmptySpaceheight] = React.useState(0);
  const [pageIndex, setPageIndex] = React.useState(0);

  const [openGroup, setOpenGroup] = React.useState<string>();

  const pages = React.useMemo(() => {
    const pages: Record<string, string[]> = {};
    Object.keys(clips).forEach(id => {
      const clip = clips[id];
      if (clip.notes) {
        pages[id] = clip.notes.split(TutorialPageSeparator, -1);
      }
    });
    return pages;
  }, [clips]);

  React.useEffect(() => {
    typedRemoveAllListeners(MainToRenderer.DocumentationNext);
    typedOn(MainToRenderer.DocumentationNext, () => {
      selectClip('next');
    });
    typedRemoveAllListeners(MainToRenderer.DocumentationBack);
    typedOn(MainToRenderer.DocumentationBack, () => {
      selectClip('previous');
    });
    typedRemoveAllListeners(MainToRenderer.DocumentationFinish);
    typedOn(MainToRenderer.DocumentationFinish, () => {
      void typedInvoke(IpcInvokeChannel.CloseCurrentProject);
    });

    dispatch(
      actions.app.toggleMenuItems({
        export: false,
        export_all: false,
        duplicate_clips: false,
        group: false,
        ungroup: false,
      }),
    );
  }, []);

  const sendProgressUpdate = () => {
    if (isTutorial) {
      const percentage = Object.keys(clips).length
        ? Math.floor(
            (getCompletedClipsCount() * 100) / Object.keys(clips).length,
          )
        : 0;
      // @oss-disable
      // @oss-disable
        // @oss-disable
        // @oss-disable
          // @oss-disable
          // @oss-disable
          // @oss-disable
        // @oss-disable
      // @oss-disable
    }
  };

  const selectClip = (direction: 'next' | 'previous') => {
    switch (direction) {
      case 'next':
        dispatch(actions.project.setAndSelectNextClip());
        break;
      default:
        dispatch(actions.project.setAndSelectPreviousClip());
        break;
    }
    sendProgressUpdate();
  };

  const onClipSelection = (
    clipId: string,
    e: React.MouseEvent<HTMLDivElement>,
  ) => {
    const modifierKey = isOnWindows ? e.ctrlKey : e.metaKey;
    if (!e.shiftKey && !modifierKey) {
      setPageIndex(0);
      dispatch(actions.project.setCurrentClip({id: clipId}));
      sendProgressUpdate();
    }
  };

  const toggleGroupCollapse = (
    group: ClipGroup,
    e: React.MouseEvent<HTMLDivElement>,
  ) => {
    e.stopPropagation();
    if (group.id !== openGroup) setOpenGroup(group.id);
    else setOpenGroup(undefined);
  };

  const keydown = React.useCallback(
    (event: KeyboardEvent) => {
      if (focus !== FocusArea.Navigator) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          selectClip('next');
          break;
        case 'ArrowUp':
          event.preventDefault();
          selectClip('previous');
          break;
        default:
          break;
      }
    },
    [focus],
  );
  useKeyboardEvent('keydown', keydown);

  const onScrollToCurrentClip = () => {
    if (clipContainerRef.current && selectedClipRef.current) {
      const {top: containerTop, height: containerHeight} =
        clipContainerRef.current.getBoundingClientRect();
      const {top: clipTop, height: clipHeight} =
        selectedClipRef.current.getBoundingClientRect();
      const hasHeader = groups.find(g =>
        g.clips.includes(currentClipId ?? ''),
      )?.isFolder;
      const isFirstClip = clipIds.indexOf(currentClipId ?? '') === 0;
      clipContainerRef.current.scrollBy({
        top:
          clipTop -
          containerTop -
          8 -
          (hasHeader ? ClipHeight : 0) -
          (isFirstClip ? 8 : 0),
        behavior: 'smooth',
      });

      setEmptySpaceheight(containerHeight - ClipHeight - 16 - clipHeight);
    } else {
      setEmptySpaceheight(0);
    }
  };

  useEffect(() => {
    if (!currentClipId) return;
    // The number of pages for a clip is known after the currentClipId is set,
    // so when going back through the pages we need to update the -1 pageIndex with the actual count
    if (pageIndex < 0) setPageIndex(pages[currentClipId].length - 1);
  }, [currentClipId]);

  const onNext = (clipId: string, isLast: boolean) => {
    if (pageIndex < pages[clipId].length - 1) {
      setPageIndex(pageIndex + 1);
    } else {
      if (!isLast) {
        setPageIndex(0);
        selectClip('next');
      } else {
        dispatch(actions.project.closeProject());
      }
    }
  };

  const onPrevious = (isFirst: boolean) => {
    if (pageIndex > 0) {
      setPageIndex(pageIndex - 1);
    } else {
      if (!isFirst) {
        setPageIndex(-1);
        selectClip('previous');
      }
    }
  };

  const clipRowFor = (clipId: string) => {
    if (!clips[clipId]) return null;
    const isSelected = currentClipId === clipId;
    const isCompleted = isClipCompleted(clipId);

    const isFirst = clipIds.indexOf(clipId) === 0;
    const isLast = clipIds.indexOf(clipId) === clipIds.length - 1;

    return (
      <div
        key={`item-${clipId}`}
        style={{position: 'relative'}}
        ref={isSelected ? selectedClipRef : undefined}>
        <span
          onClick={onClipSelection.bind(null, clipId)}
          className={`${classes.clip} tutorial ${isSelected ? 'pressed' : ''} ${isCompleted ? 'completed' : ''}`}
          style={
            isSelected && clips[clipId].notes
              ? {borderBottomLeftRadius: 0, borderBottomRightRadius: 0}
              : {}
          }>
          <span className={classes.name}>{clips[clipId].name}</span>
        </span>
        {isSelected && clips[clipId].notes ? (
          <TutorialStepsViewer
            pages={pages[clipId]}
            pageIndex={pageIndex}
            onPrevious={() => onPrevious(isFirst)}
            onComplete={() => setClipComplete(clipId)}
            onNext={() => onNext(clipId, isLast)}
            isFirst={isFirst}
            isLast={isLast}
          />
        ) : null}
      </div>
    );
  };

  const emptyView = React.useMemo(() => {
    return (
      <div className={classes.emptyView}>
        <img
          alt="Clip icon"
          src={require('../../images/clip-placeholder.svg')}
        />
        <h4>{lang('projects.empty-navigator-title')}</h4>
        <span>{lang('projects.empty-navigator-subtitle')}</span>
      </div>
    );
  }, []);

  React.useEffect(() => {
    onScrollToCurrentClip();
  }, [currentClipId, selectedClipRef.current]);

  React.useEffect(() => {
    if (currentClipId)
      setOpenGroup(groups.find(g => g.clips.includes(currentClipId))?.id);
  }, [currentClipId]);

  React.useEffect(() => {
    if (clipIds.length > 0 && isTutorial) {
      const firstIncompleteClip = clipIds.find(id => !isClipCompleted(id));
      dispatch(
        actions.project.setCurrentClip({id: firstIncompleteClip ?? clipIds[0]}),
      );
    }
  }, [sessionId]);

  return (
    <div className={classes.container} onClick={onNavigatorFocus}>
      <div className={classes.navigatorHeader}>
        <img
          className="accessory"
          style={{marginRight: '14px'}}
          src={require('../../images/icon-tutorial.svg')}
          alt=""
        />
        <span style={{marginRight: 'auto'}}>{lang('tutorial.title')}</span>
      </div>

      <div
        className={`scrollbar ${classes.clips} ${clipIds.length === 0 ? 'empty' : ''}`}
        ref={clipContainerRef}
        data-testid="navigator">
        {groups.map(g => {
          if (g.isFolder) {
            let icon = <div className={classes.circle} />;
            const isCompleted = g.clips.every(id => isClipCompleted(id));
            if (isCompleted) {
              icon = (
                <img
                  src={require('../../images/icon-success-primary.svg')}
                  className="accessory"
                  width={20}
                  height={20}
                  style={{opacity: 1}}
                />
              );
            } else if (g.clips.some(id => isClipCompleted(id))) {
              icon = (
                <CircularProgressbar
                  value={
                    (g.clips.filter(id => isClipCompleted(id)).length * 100) /
                    g.clips.length
                  }
                  strokeWidth={12}
                  styles={{
                    root: {
                      width: 20,
                      height: 20,
                    },
                    path: {
                      stroke: theme.colors.primary.main,
                      strokeLinecap: 'round',
                    },
                    trail: {
                      stroke: theme.colors.primary.background,
                      strokeLinecap: 'round',
                    },
                  }}
                />
              );
            }

            return (
              <div className={classes.group} key={g.id}>
                <div className={classes.clipHeaderTutorialContainer}>
                  <span
                    className={`${classes.clipHeader} tutorial  ${isCompleted ? 'completed' : ''}`}
                    onClick={toggleGroupCollapse.bind(null, g)}>
                    <span className={classes.icon}>{icon}</span>
                    <span className={classes.name}>{g.name}</span>
                    <span
                      className={classes.icon}
                      style={
                        g.id !== openGroup ? {} : {transform: 'scaleY(-1)'}
                      }
                      onClick={toggleGroupCollapse.bind(null, g)}>
                      <img
                        className="accessory"
                        src={require('../../images/group-chevron.svg')}
                        alt=""
                      />
                    </span>
                  </span>
                </div>
                <div
                  style={{
                    display: g.id !== openGroup ? 'none' : 'flex',
                    flexDirection: 'column',
                  }}>
                  {g.clips.map(c => clipRowFor(c))}
                </div>
              </div>
            );
          }
          if (g.clips.length !== 1) return null;
          return clipRowFor(g.clips[0]);
        })}
        {clipIds.length === 0 ? emptyView : null}
        <div
          style={{
            width: '100%',
            height: 0,
            paddingTop: `${emptySpaceHeight}px`,
          }}
        />
      </div>
    </div>
  );
}

export default React.memo(TutorialNavigator);
