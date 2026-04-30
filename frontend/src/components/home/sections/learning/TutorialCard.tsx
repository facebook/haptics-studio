/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {useDispatch} from 'react-redux';
import React, {useContext} from 'react';
import {createAppStyle} from '../../../../styles/theme.style';
import {AppContext} from '../../../../containers/App';
import {SampleProject} from '../../../../state/types';
import useTutorialStorage from '../../../../hooks/useTutorialStorage';
import {TutorialLastOpenedKey} from '../../../../globals/constants';
import {mediaPath} from '../../../../globals/utils';

const useStyles = createAppStyle(theme => ({
  item: {
    minHeight: '60px',
    color: theme.colors.text.secondary,
    borderRadius: theme.sizes.borderRadius.roundedCard,
    background: theme.colors.background.body,
    width: '100%',
    transition: 'all .1s',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: '16px',
    '&:hover': {
      background: theme.colors.background.secondaryButtonHover,
      color: theme.colors.text.primary,
      '& .side': {
        filter: 'brightness(1.1)',
      },
    },
    '& .side': {
      width: '230px',
      padding: '20px',
      position: 'relative',
      height: '100%',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      borderRadius: '0 4px 4px 0',
      '& img': {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        height: '100%',
        width: '100%',
        objectFit: 'cover',
        borderRadius: '0 4px 4px 0',
      },
      '& .tag': {
        position: 'absolute',
        right: '10px',
        top: '10px',
        whiteSpace: 'nowrap',
        width: 'min-content',
        fontSize: '12px',
        lineHeight: '16px',
        color: theme.colors.text.tag,
        background: theme.colors.background.tagOpaque,
        padding: '3px 6px',
        borderRadius: '4px',
      },
    },
  },
  itemContent: {
    flex: 1,
    alignSelf: 'stretch',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    '& .name': {
      fontWeight: 600,
      fontSize: '16px',
      lineHeight: '20px',
      color: theme.colors.text.primary,
    },
    '& .info': {
      flex: 1,
      color: theme.colors.text.secondary,
      fontWeight: 400,
      fontSize: '14px',
      lineHeight: '20px',
      display: 'inline-block',
      paddingTop: '4px',
      marginBottom: '8px',
      '&:empty:before': {
        content: '"\u00a0"',
      },
    },
  },
  progressContainer: {
    width: '200px',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  progressBar: {
    width: '80%',
    height: '4px',
    backgroundColor: '#505050',
    borderRadius: '4px',
    position: 'relative',
    '& span': {
      position: 'absolute',
      backgroundColor: theme.colors.primary.main,
      borderRadius: '4px',
      height: '4px',
    },
  },
}));

interface Props {
  tutorial: SampleProject;
  className?: string;
}

export default function TutorialCard(props: Props): JSX.Element {
  const {lang, actions, selectors} = useContext(AppContext);
  const {className = '', tutorial} = props;
  const {getCompletedClipsCount, clearTutorialHistory} = useTutorialStorage(
    tutorial.slug ?? '',
  );
  const classes = useStyles();
  const dispatch = useDispatch();
  const isOnWindows = selectors.app.isOnWindows();

  const isCompleted = tutorial.clipsCount === getCompletedClipsCount();
  const percentage = tutorial.clipsCount
    ? Math.floor((getCompletedClipsCount() * 100) / tutorial.clipsCount)
    : 0;

  const onOpenTutorial = () => {
    window.localStorage.setItem(TutorialLastOpenedKey, tutorial.slug ?? '');
    dispatch(actions.project.openProject({project: tutorial}));
    if (isCompleted) {
      clearTutorialHistory();
    }
  };

  return (
    <div
      data-testid="tutorial-card"
      className={`${className} ${classes.item}`}
      key={tutorial.projectFile}
      onClick={onOpenTutorial}>
      <div className={classes.itemContent}>
        <span className="name">{tutorial.name}</span>
        <span className="info">{tutorial.description}</span>
        <div className={classes.progressContainer}>
          <div className={classes.progressBar}>
            <span style={{width: `${percentage}%`}} />
          </div>
          {`${percentage}%`}
        </div>
      </div>
      <div className="side">
        {tutorial.icon ? (
          <img src={mediaPath(tutorial.icon, isOnWindows)} />
        ) : null}
        {tutorial.category ? (
          <span className="tag">
            {lang(`tutorial.categories.${tutorial.category}`)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

TutorialCard.defaultProps = {
  className: '',
};
