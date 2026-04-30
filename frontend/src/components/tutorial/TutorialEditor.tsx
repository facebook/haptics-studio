/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable react/no-danger */
import React, {useContext} from 'react';
import {useDispatch} from 'react-redux';
import {debounce} from 'lodash';
import {createAppStyle} from '../../styles/theme.style';
import {AppContext} from '../../containers/App';
import useTutorialStorage from '../../hooks/useTutorialStorage';
import useUpdateEffect from '../../hooks/useUpdateEffect';

const useStyles = createAppStyle(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    padding: '12px 8px',
    height: '100%',
    gap: '12px',
    '& textarea, & input': {
      flex: 1,
      fontFamily: 'inherit',
      fontSize: '14px',
      lineHeight: '18px',
      height: '100%',
      width: '100%',
      color: theme.colors.text.secondary,
      resize: 'none',
      borderStyle: 'solid',
      transition: 'all .5s',
      background: theme.colors.input.background,
      borderRadius: theme.sizes.borderRadius.card,
      borderWidth: '1px',
      borderColor: theme.colors.input.border,
      '&:hover, &:focus': {
        borderColor: theme.colors.input.borderFocused,
      },
    },
    '& textarea': {
      padding: '12px 10px',
      fontFamily: 'monospace',
    },
  },
  label: {
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: 500,
    color: theme.colors.text.primary,
    paddingLeft: '12px',
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    padding: '0px 0px',
    gap: '8px',
    '& > input': {
      height: '32px',
      padding: '10px 10px',
    },
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0px 0px',
    gap: '8px',
  },
}));

const eyeOpenIcon = require('../../images/eye-circle.svg');
const eyeClosed = require('../../images/eye-closed.svg');
const settingsIcon = require('../../images/settings.svg');

function TutorialEditor() {
  const dispatch = useDispatch();
  const {selectors, actions} = useContext(AppContext);
  const classes = useStyles();

  const sessionId = selectors.project.getSessionId();
  const {slug, isTutorial} = selectors.project.getProjectInfo();
  const {clearTutorialHistory} = useTutorialStorage(
    slug ?? sessionId ?? '',
    !isTutorial,
  );
  const currentClip = selectors.project.getCurrentClip();
  const currentClipId = selectors.project.getCurrentClipId();
  const tutorialEditor = selectors.app.getTutorialEditorState();
  const [notes, setNotes] = React.useState(currentClip?.notes ?? '');

  React.useEffect(() => {
    setNotes(currentClip?.notes ?? '');
  }, [currentClip]);

  const onSave = React.useCallback(
    debounce((n: string) => {
      if (currentClipId)
        dispatch(
          actions.project.updateTutorialNotes({
            clipId: currentClipId,
            notes: n,
          }),
        );
    }, 200),
    [currentClipId],
  );

  useUpdateEffect(() => {
    onSave(notes);
  }, [notes]);

  /* Preview */
  const onTogglePreview = (visible: boolean) => {
    dispatch(actions.app.showTutorialPreview({visible}));
    if (!visible) clearTutorialHistory();
  };

  /* Settings */
  const onOpenTutorialSettings = () => {
    dispatch(actions.app.showTutorialSettings({visible: true}));
  };

  return (
    <div className={classes.container}>
      <div className={classes.actions}>
        <span className={classes.label} style={{marginRight: 'auto'}}>
          Tutorial Editor
        </span>
        <div
          className="hsbutton secondary icon borderless"
          data-testid="preview-button"
          onClick={() => onTogglePreview(!tutorialEditor.showPreview)}>
          <img src={!tutorialEditor.showPreview ? eyeOpenIcon : eyeClosed} />
        </div>
        <div
          className="hsbutton secondary icon borderless"
          data-testid="settings-button"
          onClick={() => onOpenTutorialSettings()}>
          <img src={settingsIcon} />
        </div>
      </div>
      <span className={classes.label}>Clip Content:</span>
      <div className={classes.info} style={{flex: 1}}>
        <div style={{flex: 1}}>
          <textarea
            className="scrollbar"
            rows={30}
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

export default React.memo(TutorialEditor);
