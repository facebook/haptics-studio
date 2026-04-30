/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useContext} from 'react';
import {useDispatch} from 'react-redux';

import {AppContext} from '../../../containers/App';
import {TutorialPrefix} from '../../../globals/constants';
import {SampleProject} from '../../../state/types';
import {useStyles} from './Sections.styles';
import {mediaPath} from '../../../globals/utils';

export default function SamplesSection(): JSX.Element {
  const {lang, actions, selectors} = useContext(AppContext);
  const classes = useStyles();
  const dispatch = useDispatch();
  const sampleProjects = selectors.app.getSampleProjects();
  const isOnWindows = selectors.app.isOnWindows();
  const samplesList: SampleProject[] = sampleProjects.filter(
    s =>
      !s.projectFile.includes(TutorialPrefix) && !s.projectFile.includes('._'),
  );

  const onSampleClick = (project: SampleProject) => {
    dispatch(actions.project.openProject({project}));
  };

  return (
    <div className={classes.container} data-testid="learning-section">
      <div className={classes.header}>
        <h4 className="title" style={{marginTop: '8px', padding: '0 8px'}}>
          {lang(`home.samples-section-title`)}
        </h4>
      </div>
      <div className={classes.list}>
        {samplesList.map(sample => (
          <span
            data-testid="sample-card"
            key={`sample-${sample.name}}`}
            role="button"
            className={classes.item}
            onClick={() => onSampleClick(sample)}>
            <div className={classes.itemContent}>
              <span className="name">
                {sample.name}
                {sample.new ? (
                  <span className="new">{lang('home.sample-new')}</span>
                ) : null}
              </span>
              <span className="tag">
                {lang('home.clips-count', {
                  smart_count: sample.clipsCount ?? 0,
                })}
              </span>
            </div>
            {sample.icon ? (
              <img
                src={mediaPath(sample.icon, isOnWindows)}
                alt={sample.name}
              />
            ) : null}
          </span>
        ))}
      </div>
    </div>
  );
}
