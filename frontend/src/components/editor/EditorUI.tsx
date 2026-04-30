/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useContext} from 'react';
import {useDispatch} from 'react-redux';
import {useDropzone} from 'react-dropzone';
import {createAppStyle} from '../../styles/theme.style';
import Spinner from '../common/Spinner';
import {AppContext} from '../../containers/App';
import Editor from './Editor';
import RightPanel from './rightpanel/RightPanel';
import LeftPanel from './leftpanel/LeftPanel';
import ErrorBoundary from '../common/ErrorBoundary';
import {getEmptyClip} from '../../state/project/selectors';
import {analyzeFiles} from '../../globals/utils';
import {MimeTypes} from '../../../src/globals/constants';

const useStyles = createAppStyle(theme => ({
  container: {
    display: 'flex',
    height: `calc(100vh - ${theme.sizes.windowHeaderHeight})`,
    position: 'relative',
    backgroundColor: theme.colors.background.dark,
  },
  editor: {
    flex: 1,
    marginRight: 0,
  },
  placeholder: {
    flex: 1,
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.4,
  },
  retry: {
    backgroundColor: theme.colors.background.dark,
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    fontSize: '16px',
    lineHeight: '20px',
    fontWeight: 600,
    color: theme.colors.text.primary,
    gap: '8px',
    margin: '0px 0px 8px',
  },
  error: {
    color: theme.colors.text.secondary,
    fontWeight: 500,
    marginBottom: '8px',
  },
}));

/**
 * Main Editor UI
 */
function EditorUI() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const {selectors, actions, lang} = useContext(AppContext);
  const emptyClip = getEmptyClip();
  const groups = selectors.project.getGroups();
  const clip = selectors.project.getCurrentClip() ?? emptyClip;
  const currentClipId = selectors.project.getCurrentClipId();
  const {isTutorial} = selectors.project.getProjectInfo();
  const clipIds = selectors.project.getClipIds();
  const loading = selectors.project.getProjectLoading();

  React.useEffect(() => {
    // Sync current clip with the backend
    if (currentClipId) {
      dispatch(actions.project.switchClip({clipId: currentClipId}));
    }
  }, [currentClipId]);

  React.useEffect(() => {
    // Sync groups with the backend
    dispatch(actions.project.syncGroups({groups}));
  }, [groups]);

  const onRetry = () => {
    if (currentClipId && clip.audio && clip.audio.path) {
      dispatch(
        actions.project.retryAudioAnalysis({
          clipId: currentClipId,
          settings: clip.state.present.dsp,
        }),
      );
    }
  };

  const onDrop = React.useCallback(acceptedFiles => {
    analyzeFiles(acceptedFiles, dispatch, actions);
  }, []);
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const {getRootProps, getInputProps, isDragAccept} = useDropzone({
    onDrop,
    accept: MimeTypes,
    noClick: true,
    noKeyboard: true,
    multiple: true,
    disabled: isTutorial,
  });

  return (
    <div className={classes.container} {...getRootProps()}>
      <input {...getInputProps()} />
      <LeftPanel isDragAccept={isDragAccept} />
      {!clip.failed && !loading ? (
        <ErrorBoundary
          undoAction={() => {
            dispatch(actions.project.undo({clipId: currentClipId}));
          }}>
          <Editor className={classes.editor} />
        </ErrorBoundary>
      ) : null}
      {currentClipId && clip.failed && !loading ? (
        <div className={classes.retry}>
          Analysis failed <span className={classes.error}>{clip.error}</span>
          <button type="button" onClick={onRetry} className="hsbutton">
            Try again
          </button>
        </div>
      ) : null}
      {currentClipId === undefined && !loading && clipIds.length !== 0 ? (
        <div className={classes.placeholder}>
          {lang('projects.cta-select-clip')}
        </div>
      ) : null}
      {loading ? <Spinner absolute /> : null}
      <RightPanel />
    </div>
  );
}

export default React.memo(EditorUI);
