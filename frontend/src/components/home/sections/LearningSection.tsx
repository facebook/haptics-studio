/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useContext} from 'react';

import {AppContext} from '../../../containers/App';
import {
  TutorialDefaultProject,
  TutorialPrefix,
} from '../../../globals/constants';
import TutorialCard from './learning/TutorialCard';
import ResourceCard from './learning/ResourceCard';
import ExternalResources from '../../../globals/ExternalResources.json';
import {ExternalResource, SampleProject} from '../../../state/types';
import {useStyles} from './Sections.styles';

type LearningType = 'tutorials' | 'resources';

export default function LearningSection(): JSX.Element {
  const {lang, selectors} = useContext(AppContext);
  const classes = useStyles();
  const sampleProjects = selectors.app.getSampleProjects();

  // Set the default tutorial as first and sort the remaining by date
  const tutorialProjects = React.useMemo(
    () =>
      sampleProjects
        .filter(
          s =>
            s.projectFile.includes(TutorialPrefix) &&
            !s.projectFile.includes('._'),
        )
        .sort((a, b) => {
          if (a.slug === TutorialDefaultProject) return -1;
          if (b.slug === TutorialDefaultProject) return 1;
          return (a.updatedAt ?? 0) - (b.updatedAt ?? 0);
        }),
    [sampleProjects],
  );

  const listOf = (
    data: SampleProject[] | ExternalResource[],
    type: LearningType,
  ) => {
    if (!data) return null;
    return (
      <>
        <div className={classes.header}>
          <h4 className="title" style={{marginTop: '8px', padding: '0 8px'}}>
            {lang(`home.${type}-section-title`)}
          </h4>
        </div>
        <div className={`${classes.list} ${type === 'tutorials' ? 'two' : ''}`}>
          {data.map(r => {
            switch (type) {
              case 'tutorials':
                return (
                  <TutorialCard
                    key={(r as SampleProject).projectFile}
                    tutorial={r as SampleProject}
                  />
                );
              case 'resources':
                return (
                  <ResourceCard
                    key={(r as ExternalResource).title}
                    resource={r as ExternalResource}
                  />
                );
              default:
                return null;
            }
          })}
        </div>
      </>
    );
  };

  return (
    <div className={classes.container} data-testid="learning-section">
      {listOf(tutorialProjects, 'tutorials')}
      {listOf(ExternalResources, 'resources')}
    </div>
  );
}
