/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useState, useCallback, useContext} from 'react';
import {useDispatch} from 'react-redux';
import {AppContext} from '../../../containers/App';
import {createAppStyle} from '../../../styles/theme.style';
import {ZIndex} from '../../../styles/zIndex';
import {useMouseEvent} from '../../../hooks/useMouseEvent';
import {useFocusArea} from '../../../hooks/useFocusArea';
import Navigator from './Navigator';
import {FocusArea} from '../../../state/types';
import TutorialNavigator from '../../tutorial/TutorialNavigator';

const useStyles = createAppStyle(theme => ({
  container: {
    zIndex: ZIndex.Panel,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.colors.background.dark,
    paddingLeft: '8px',
  },
  handle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '5px',
    cursor: 'ew-resize',
  },
}));

/**
 * Left panel container
 */
function LeftPanel(props: {isDragAccept: boolean}) {
  const {isDragAccept} = props;
  const classes = useStyles();
  const dispatch = useDispatch();
  const {selectors, actions} = useContext(AppContext);
  const project = selectors.project.getProjectInfo();
  const sidePanelWidth = selectors.app.getSidePanelWidth(
    project.isTutorial ? 'tutorial' : 'left',
  );

  const {setFocus: onFocus} = useFocusArea(FocusArea.Navigator);
  const tutorialEditor = selectors.app.getTutorialEditorState();

  const [isMovingHandle, setIsMovingHandle] = useState(false);

  const onMouseMove = useCallback(
    (event: MouseEvent) => {
      if (isMovingHandle) {
        dispatch(
          actions.app.setSidePanelWidth({
            width: event.clientX,
            side: project.isTutorial ? 'tutorial' : 'left',
          }),
        );
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

  return (
    <div
      className={classes.container}
      style={{width: `${sidePanelWidth}px`}}
      onClick={onFocus}>
      {project.isTutorial ||
      (project.isAuthoringTutorial && tutorialEditor.showPreview) ? (
        <TutorialNavigator />
      ) : (
        <Navigator isDragAccept={isDragAccept} />
      )}
      <div
        className={classes.handle}
        onMouseDown={() => setIsMovingHandle(true)}
      />
    </div>
  );
}

export default React.memo(LeftPanel);
