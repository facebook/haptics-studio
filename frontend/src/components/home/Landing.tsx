/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {useDispatch} from 'react-redux';
import React, {useContext, useCallback, useEffect, useMemo} from 'react';
import {useDropzone} from 'react-dropzone';
import {webUtils} from 'electron';
import {IpcInvokeChannel} from '../../../../shared';
import {typedInvoke} from '../../../../shared/typed-ipc';
import semver from 'semver';

import {createAppStyle} from '../../styles/theme.style';
import {AppContext} from '../../containers/App';
import {MimeTypes} from '../../globals/constants';
import UpdaterPrompt from './UpdaterPrompt';
import {LandingPageSection} from '../../state/types';
import {analyzeFiles} from '../../globals/utils';
import useLocalStorage from '../../hooks/useLocalStorage';
import ProjectsSection from './sections/ProjectsSection';
import LearningSection from './sections/LearningSection';
import SamplesSection from './sections/SamplesSection';
import TelemetryNotification from './TelemetryNotification';

import BugIcon from '../../images/bug.svg';
import AddIconBlack from '../../images/icon-add-circle-black.svg';
import IconFolder from '../../images/icon-folder.svg';
import IconLearning from '../../images/icon-learning.svg';
import IconSamples from '../../images/icon-samples.svg';

const MenuIcons = {
  [LandingPageSection.Projects]: IconFolder,
  [LandingPageSection.Learning]: IconLearning,
  [LandingPageSection.Samples]: IconSamples,
};

const useStyles = createAppStyle(theme => ({
  container: {
    width: '100%',
    height: `calc(100vh - ${theme.sizes.windowHeaderHeight})`,
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.dark,
    paddingLeft: '24px',
    '& aside': {
      width: '280px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      padding: '0 0 20px 0',
    },
  },
  tabs: {
    width: '100%',
    padding: '0 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    '& div': {
      width: '100%',
      margin: 0,
      borderRadius: '4px',
      color: 'white',
      fontSize: '13px',
      lineHeight: '20px',
      height: '34px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '0 8px',
      transition: 'all 0.1s linear',
      fontWeight: 500,
      '& img': {
        filter: 'invert(1)',
      },
      '&:hover': {
        background: theme.colors.navigator.hover,
      },
      '&.selected': {
        background: theme.colors.navigator.selected,
      },
      '&.new': {
        position: 'relative',
      },
      '&.new:after': {
        content: '"NEW"',
        fontSize: '10px',
        lineHeight: '13px',
        height: '13px',
        borderRadius: '4px',
        fontWeight: 600,
        color: theme.colors.text.primary,
        background: theme.colors.background.dark,
        padding: '1px 4px',
        letterSpacing: '1px',
        position: 'absolute',
        top: '2px',
        right: '4px',
        transform: 'translateY(50%)',
      },
    },
  },
  body: {
    overflowY: 'auto',
    overflowX: 'hidden',
    scrollbarGutter: 'stable',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '0 24px 24px 24px',
  },
  mainButtonLabel: {
    fontSize: '15px',
    lineHeight: '20px',
  },
  newButton: {
    backgroundColor: theme.colors.background.primaryButton,
    fontSize: '14px',
    width: '100%',
    height: '42px',
  },
}));

const ContentFlags = {
  samples: {
    key: 'samples-new',
    showNew: true,
    sinceVersion: '2.2.0',
  },
  tutorials: {
    key: 'tutorials-new',
    showNew: false,
    sinceVersion: '2.0.0',
  },
};

/**
 * Entry point where the user can create or select a previous project
 */
export default function LandingContainer(): JSX.Element {
  const {lang, actions, selectors} = useContext(AppContext);
  const classes = useStyles();
  const dispatch = useDispatch();

  const {version} = selectors.app.getWindowInformation();
  const currentSection = selectors.app.getLandingPageSection();
  const telemetryState = selectors.app.getTelemetryState();

  const [newSamplesValue, setNewSamplesValue] = useLocalStorage(
    ContentFlags.samples.key,
  );
  const [newTutorialsValue, setNewTutorialsValue] = useLocalStorage(
    ContentFlags.tutorials.key,
  );

  useEffect(() => {
    dispatch(actions.app.fetchRecents());
  }, []);

  const shouldShowNewBadge = useCallback(
    (config: typeof ContentFlags.samples, storedValue: string | null) => {
      if (version.length === 0) return false;

      return (
        config.showNew &&
        (storedValue === null || semver.lt(storedValue, config.sinceVersion))
      );
    },
    [version],
  );

  const showNewSamples = useMemo(
    () => shouldShowNewBadge(ContentFlags.samples, newSamplesValue),
    [shouldShowNewBadge, newSamplesValue],
  );

  const showNewTutorials = useMemo(
    () => shouldShowNewBadge(ContentFlags.tutorials, newTutorialsValue),
    [shouldShowNewBadge, newTutorialsValue],
  );

  const onDrop = useCallback(acceptedFiles => {
    analyzeFiles(acceptedFiles, dispatch, actions);
  }, []);

  const onDropRejected = useCallback(rejectedFiles => {
    if (rejectedFiles.length === 1) {
      if (
        (rejectedFiles[0].file.path as string).endsWith('.lofelt') ||
        (rejectedFiles[0].file.path as string).endsWith('.hasp')
      ) {
        dispatch(
          actions.project.openProject({
            project: {
              name: rejectedFiles[0].file.name,
              projectFile: webUtils.getPathForFile(rejectedFiles[0].file),
            },
          }),
        );
      }
    }
  }, []);

  // eslint-disable-next-line @typescript-eslint/unbound-method
  const {getRootProps, getInputProps} = useDropzone({
    onDrop,
    onDropRejected,
    accept: MimeTypes,
    multiple: true,
    noClick: true,
    noKeyboard: true,
  });

  const onNewProject = () => {
    void typedInvoke(IpcInvokeChannel.NewProject);
  };

  const route = React.useMemo(() => {
    switch (currentSection) {
      case LandingPageSection.Learning:
        return <LearningSection />;
      case LandingPageSection.Samples:
        return <SamplesSection />;
      case LandingPageSection.Projects:
      default:
        return <ProjectsSection />;
    }
  }, [currentSection]);

  React.useEffect(() => {
    if (currentSection === LandingPageSection.Learning) {
      setNewTutorialsValue(version);
    } else if (currentSection === LandingPageSection.Samples) {
      setNewSamplesValue(version);
    }
  }, [currentSection, version, setNewTutorialsValue, setNewSamplesValue]);

  return (
    <div
      className={classes.container}
      {...getRootProps()}
      data-testid="landing-content">
      <input {...getInputProps()} />
      <aside>
        <button
          type="button"
          className={`hsbutton ${classes.newButton}`}
          onClick={() => onNewProject()}>
          <img src={AddIconBlack} style={{width: '18px', height: '18px'}} />
          <span className={classes.mainButtonLabel}>
            {lang('home.start-new-project-title')}
          </span>
        </button>
        <div className="rldsspacer" style={{margin: '16px 0'}} />
        <div className={classes.tabs}>
          {[
            LandingPageSection.Projects,
            LandingPageSection.Learning,
            LandingPageSection.Samples,
          ].map(section => (
            <div
              role="menuitem"
              key={section}
              className={`${currentSection === section ? 'selected' : ''}
                ${section === LandingPageSection.Learning && showNewTutorials ? 'new' : ''}
                ${section === LandingPageSection.Samples && showNewSamples ? 'new' : ''}
                `}
              onClick={() =>
                dispatch(actions.app.setLandingPageSection({section}))
              }>
              <img src={MenuIcons[section]} />
              {lang(`home.sections.${section}`)}
            </div>
          ))}
        </div>
        <div style={{flex: '1'}} />
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
      </aside>
      <div className={`${classes.body} scrollbar`}>
        <UpdaterPrompt />
        {telemetryState.shouldShowTelemetryNotification ? (
          <TelemetryNotification />
        ) : null}
        {route}
      </div>
    </div>
  );
}
