/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useContext} from 'react';
import {useDispatch} from 'react-redux';
import {v4 as uuidv4} from 'uuid';

import {createAppStyle} from '../../styles/theme.style';
import {ZIndex} from '../../styles/zIndex';
import {AppContext} from '../../containers/App';

import StartPen from '../../images/startscreen-pen.png';
import StartAudio from '../../images/startscreen-audio.png';

const useStyles = createAppStyle(theme => ({
  container: {
    pointerEvents: 'auto',
    position: 'fixed',
    display: 'flex',
    alignContent: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    top: theme.sizes.windowHeaderHeight,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: ZIndex.Dialog,
  },
  dialog: {
    width: '720px',
    backgroundColor: theme.colors.background.dark,
    borderRadius: '14px',
    padding: '24px',
    '& h1': {
      fontSize: '16px',
      fontWeight: 600,
      textAlign: 'center',
      lineHeight: '24px',
      marginBottom: '20px',
      mareginTop: '0px',
    },
    '& section': {
      display: 'flex',
      gap: '30px',
    },
  },
  description: {
    textAlign: 'left',
    padding: '12px',
    borderRadius: '0 0 8px 8px',
  },
  button: {
    backgroundColor: theme.colors.background.hover,
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    border: 'none',
    borderRadius: '8px',
    color: theme.colors.text.primary,
    padding: '0',
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
      filter: 'brightness(1.2)',
      backgroundColor: theme.colors.navigator.selected,
    },
    '& h3': {
      marginTop: '4px',
      marginBottom: '4px',
      fontWeight: 600,
      fontSize: '16px',
    },
    '& img': {
      borderRadius: '8px 8px 0 0',
      width: '100%',
    },
    '& span': {
      textAlign: 'left',
      color: theme.colors.text.secondary,
      lineHeight: '20px',
      fontSize: '14px',
    },
  },
}));

/**
 * Overlay with the user guidance on how to start using the editor
 */
function GuidanceOverlay() {
  const classes = useStyles();
  const {actions, lang, selectors} = useContext(AppContext);
  const dispatch = useDispatch();
  const isOnWindows = selectors.app.isOnWindows();

  const onOpenFiles = () => {
    const properties = isOnWindows ? ['openFile'] : undefined;
    dispatch(actions.project.requestAddFiles({properties}));
  };

  const onPenClip = () => {
    const clipId = uuidv4();
    dispatch(actions.project.createEmptyClip({clipId}));
  };

  return (
    <div className={classes.container}>
      <div className={classes.dialog}>
        <h1>{lang('editor.guidance.title')}</h1>
        <section>
          <div
            data-testid="create-audio"
            className={classes.button}
            onClick={onOpenFiles}>
            <img src={StartAudio} alt="arrow" />
            <div className={classes.description}>
              <h3>{lang('editor.guidance.audio-title')}</h3>
              <span>{lang('editor.guidance.audio-text')}</span>
            </div>
          </div>
          <div
            data-testid="create-pen"
            className={classes.button}
            onClick={onPenClip}>
            <img className="right" src={StartPen} alt="arrow" />
            <div className={classes.description}>
              <h3>{lang('editor.guidance.pen-title')}</h3>
              <span>{lang('editor.guidance.pen-text')}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default React.memo(GuidanceOverlay);
