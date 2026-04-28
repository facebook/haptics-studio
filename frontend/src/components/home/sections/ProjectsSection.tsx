/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {useDispatch} from 'react-redux';
import React, {useContext, useEffect, useCallback} from 'react';
import {DateTime} from 'luxon';
import {createAppStyle} from '../../../styles/theme.style';
import {AppContext} from '../../../containers/App';
import {
  LandingPageSection,
  RecentProject,
  SampleProject,
} from '../../../state/types';

import LearningImage from '../../../images/learning-section-hero.png';
import CloseButton from '../../common/CloseButton';
import useLocalStorage from '../../../hooks/useLocalStorage';

const BannerDismissedKey = 'getting-started-banner-dismissed';

const useStyles = createAppStyle(theme => ({
  container: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.lg,
    paddingBottom: '32px',
    '& h4': {
      fontSize: '16px',
      fontWeight: 400,
      marginBottom: '0px',
      marginTop: '16px',
    },
  },
  intro: {
    display: 'flex',
    gap: theme.spacing.lg,
  },
  banner: {
    flex: 2,
    position: 'relative',
    background: theme.colors.background.body,
    display: 'flex',
    alignItems: 'flex-start',
    '&:hover': {
      background: theme.colors.background.secondaryButtonHover,
      '& .image-container': {
        filter: 'brightness(1.1)',
      },
    },
    borderRadius: theme.sizes.borderRadius.roundedCard,
    '& .body': {
      padding: theme.spacing.lg,
      flex: 2,
      maxWidth: '40%',
    },
    '& .tag': {
      fontSize: '11px',
      fontWeight: 400,
      lineHeight: '16px',
      textTransform: 'uppercase',
      backgroundColor: theme.colors.plot.amplitude,
      padding: '3px 6px',
      borderRadius: theme.sizes.borderRadius.card,
    },
    '& .title': {
      fontSize: '16px',
      fontWeight: 500,
      fontStyle: 'normal',
      lineHeight: '20px',
      margin: '10px 0',
    },
    '& .description': {
      fontSize: '14px',
      color: theme.colors.text.secondary,
    },
    '& .image-container': {
      flex: 1,
      height: '100%',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      borderRadius: `0 ${theme.sizes.borderRadius.roundedCard} ${theme.sizes.borderRadius.roundedCard} 0`,
    },
  },
  closeButton: {
    position: 'absolute',
    top: '8px',
    right: '8px',
  },
  projectsHeader: {
    marginTop: theme.spacing.lg,
    display: 'flex',
    justifyContent: 'space-between',
  },
  list: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.lg,
    rowGap: theme.spacing.lg,
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    '& button': {
      justifyContent: 'flex-start',
      padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
    },
  },
  empty: {
    color: theme.colors.text.secondary,
  },
  item: {
    minHeight: '60px',
    color: theme.colors.text.secondary,
    borderRadius: theme.sizes.borderRadius.roundedCard,
    width: '100%',
    padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
    transition: 'all .1s',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
    '& img': {
      height: 28,
      width: 28,
      marginRight: theme.spacing.sm,
    },
    '&:hover': {
      background: theme.colors.background.secondaryButton,
      color: theme.colors.text.primary,
    },
    '&:last-of-type': {
      alignSelf: 'flex-start',
    },
  },
  itemContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
    '& .name': {
      fontWeight: 600,
      fontSize: '16px',
      lineHeight: '20px',
      color: theme.colors.text.primary,
      display: 'flex',
      gap: '6px',
      position: 'relative',
      '& .new': {
        position: 'relative',
        top: '-6px',
        color: theme.colors.button.primary.main,
        textTransform: 'uppercase',
        fontSize: '10px',
        fontWeight: 100,
      },
    },
    '& .info': {
      color: theme.colors.text.secondary,
      fontWeight: 400,
      fontSize: '14px',
      lineHeight: '20px',
      display: 'inline-block',
      paddingTop: '4px',
      '&:empty:before': {
        content: '"\u00a0"',
      },
    },
    '& .tag': {
      whiteSpace: 'nowrap',
      width: 'min-content',
      fontSize: '12px',
      lineHeight: '16px',
      color: theme.colors.text.tag,
      background: theme.colors.background.tag,
      padding: '3px 6px',
      borderRadius: theme.sizes.borderRadius.card,
    },
    '&:hover': {
      '& .tag': {
        backgroundColor: theme.colors.text.pressed,
        color: theme.colors.text.dark,
      },
    },
  },
  leftContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  mainButtonLabel: {
    fontSize: '12px',
    lineHeight: '20px',
  },
}));

/**
 * Entry point where the user can create or select a previous project
 */
export default function ProjectsSection(): JSX.Element {
  const {lang, actions, selectors} = useContext(AppContext);
  const classes = useStyles();
  const dispatch = useDispatch();
  const recentProjects = selectors.app.getRecentProjects();
  const [bannerDismissed, setBannerDismissed] =
    useLocalStorage(BannerDismissedKey);

  useEffect(() => {
    dispatch(actions.app.fetchRecents());
  }, []);

  const onRecentClick = (project: RecentProject | SampleProject) => {
    dispatch(actions.project.openProject({project}));
  };

  const onLearnMore = () => {
    dispatch(
      actions.app.setLandingPageSection({section: LandingPageSection.Learning}),
    );
  };

  const onDismissBanner = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setBannerDismissed('true');
    },
    [setBannerDismissed],
  );

  const onOpenProject = () => {
    dispatch(actions.app.openProjectFromBrowser());
  };

  return (
    <div className={classes.container} data-testid="projects-selection">
      {bannerDismissed !== 'true' ? (
        <>
          <h4 className="title" style={{marginTop: '8px', padding: '0 8px'}}>
            {lang('home.getting-started-title')}
          </h4>

          <div className={classes.intro}>
            <div
              className={classes.banner}
              onClick={onLearnMore}
              style={{
                backgroundImage: `url(${LearningImage})`,
                backgroundSize: 'cover',
              }}>
              <div className="body">
                <span className="tag">{lang('home.start-banner-tag')}</span>
                <h2 className="title">{lang('home.start-banner-title')}</h2>
                <span className="description">
                  {lang('home.start-banner-subtitle')}
                </span>
              </div>
              <CloseButton
                className={classes.closeButton}
                onClick={onDismissBanner}
                aria-label="Dismiss"
              />
            </div>
          </div>
        </>
      ) : null}

      <div className={classes.projectsHeader}>
        <h4 className="title" style={{marginTop: '8px', padding: '0 8px'}}>
          {lang('home.sections.projects')}
        </h4>
        <button
          type="button"
          className="hsbutton borderless"
          onClick={() => onOpenProject()}>
          <img
            src={require('../../../images/new-folder.svg')}
            style={{width: '18px', height: '18px'}}
          />
          <span className={classes.mainButtonLabel}>
            {lang('home.open-project-title')}
          </span>
        </button>
      </div>

      {recentProjects.length > 0 ? (
        <div className={classes.list}>
          {recentProjects.map(r => {
            let relative: string | null = null;
            if (r.updatedAt) {
              const editedDiff = DateTime.fromMillis(r.updatedAt).diffNow()
                .milliseconds;
              relative = DateTime.fromMillis(r.updatedAt).toRelative({
                unit: ['years', 'months', 'weeks', 'days', 'hours', 'minutes'],
              });
              if (editedDiff * -1 < 60 * 1000) {
                relative = lang('home.project-edited-less-than-one-minute-ago');
              }
            }
            return (
              <div
                className={classes.item}
                role="button"
                key={r.projectFile}
                onClick={onRecentClick.bind(null, r)}>
                <div className={classes.itemContent}>
                  <div className={classes.leftContent}>
                    <span className="name">{r.name}</span>
                    <span className="info">
                      {relative ? lang('home.project-edited', {relative}) : ''}
                    </span>
                  </div>
                  {r.clipsCount !== undefined ? (
                    <span className="tag">
                      {lang('home.clips-count', {smart_count: r.clipsCount})}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={classes.empty}>{lang('home.no-recent-projects')}</div>
      )}
    </div>
  );
}
