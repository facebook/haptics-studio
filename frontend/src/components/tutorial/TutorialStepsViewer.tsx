/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable react/no-danger */
import React, {useContext} from 'react';
import {markdownToSafeHtml} from '../../utils/sanitizeHtml';
import {createAppStyle} from '../../styles/theme.style';
import {FocusArea} from '../../state/types';
import {AppContext} from '../../containers/App';
import {useKeyboardEvent} from '../../hooks/useKeyboardEvent';

const useStyles = createAppStyle(theme => ({
  container: {
    minHeight: '560px',
    backgroundColor: theme.colors.background.body,
    display: 'flex',
    flexDirection: 'column',
    borderBottomLeftRadius: theme.sizes.borderRadius.card,
    borderBottomRightRadius: theme.sizes.borderRadius.card,
    '& textarea': {
      fontFamily: 'inherit',
      fontSize: '0.75rem',
      height: '100%',
      marginTop: '8px',
      backgroundColor: theme.colors.background.tag,
      color: 'white',
      border: 'none',
      borderRadius: '2px',
      padding: '8px',
      resize: 'vertical',
    },
  },
  preview: {
    overflow: 'auto',
    padding: '0px 12px 8px',
    '& p': {
      marginBlockStart: '0px',
    },
    '& img, & video': {
      borderRadius: '4px',
    },
    '& b, & strong': {
      fontWeight: 600,
    },
    '& .category': {
      display: 'inline-block',
      fontWeight: 400,
      margin: '4px 0px',
      fontSize: '11px',
      lineHeight: '16px',
      textTransform: 'uppercase',
      color: theme.colors.text.secondary,
    },
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
  },
  counter: {
    fontSize: '14px',
    lineHeight: '18px',
    color: theme.colors.text.secondary,
    fontWeight: 500,
  },
}));

interface Props {
  isFirst: boolean;
  isLast: boolean;
  pages: string[];
  pageIndex: number;
  onPrevious: () => void;
  onComplete: () => void;
  onNext: () => void;
}

function TutorialStepsViewer(props: Props) {
  const {selectors, lang} = useContext(AppContext);
  const focus = selectors.app.getFocus();
  const {isAuthoringTutorial} = selectors.project.getProjectInfo();
  const {isFirst, isLast, pages, pageIndex, onPrevious, onComplete, onNext} =
    props;
  const classes = useStyles();

  const hasFinished = isLast && pageIndex === pages.length - 1;

  const keydown = React.useCallback(
    (event: KeyboardEvent) => {
      if (focus !== FocusArea.Navigator) return;

      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          if (!hasFinished) onNext();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          onPrevious();
          break;
        default:
          break;
      }
    },
    [onNext, onPrevious, focus, isLast, pageIndex],
  );
  useKeyboardEvent('keydown', keydown);

  // The lesson is set as complete when the last page is reached
  React.useEffect(() => {
    if (pageIndex === pages.length - 1) {
      onComplete();
    }
  }, [pageIndex]);

  const preventDefault = React.useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  return (
    <div
      className={classes.container}
      onDragOver={preventDefault}
      onDrop={preventDefault}>
      <div style={{flex: 1}}>
        <div
          className={`${classes.preview} markdown scrollbar`}
          dangerouslySetInnerHTML={{
            __html: markdownToSafeHtml(
              pageIndex < pages.length ? pages[pageIndex] : '',
            ),
          }}
        />
      </div>
      <div className={classes.buttonContainer}>
        <button
          type="button"
          className={`hsbutton secondary ${isFirst && pageIndex === 0 ? 'disabled' : ''}`}
          onClick={onPrevious}>
          {lang('tutorial.action-previous')}
        </button>
        {pages.length > 1 ? (
          <span
            className={
              classes.counter
            }>{`${pageIndex + 1}/${pages.length}`}</span>
        ) : null}
        <button
          type="button"
          className={`hsbutton ${hasFinished && isAuthoringTutorial ? 'disabled' : ''}`}
          onClick={onNext}>
          {!hasFinished
            ? lang('tutorial.action-next')
            : lang('tutorial.action-complete')}
        </button>
      </div>
    </div>
  );
}

TutorialStepsViewer.defaultProps = {
  notes: undefined,
};

export default React.memo(TutorialStepsViewer);
