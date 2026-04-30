/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useContext} from 'react';
import {useDispatch} from 'react-redux';
import Select from 'react-select';
import {createAppStyle, theme} from '../../styles/theme.style';
import {ZIndex} from '../../styles/zIndex';
import {
  overlayCentered,
  dialogPanel,
  dialogTitle,
  dialogActions,
} from '../../styles/shared.styles';
import {AppContext} from '../../containers/App';
import {ProjectMetadata, TutorialCategory} from '../../state/types';
import CloseButton from '../common/CloseButton';

const useStyles = createAppStyle(theme => ({
  background: {
    ...overlayCentered,
    zIndex: ZIndex.Dialog,
  },
  dialog: {
    ...dialogPanel(theme),
    minWidth: '400px',
    backgroundColor: theme.colors.background.dark,
    borderRadius: theme.sizes.borderRadius.card,
  },
  header: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${theme.spacing.sm} ${theme.spacing.sm} ${theme.spacing.sm} ${theme.spacing.md}`,
    borderBottom: `1px solid ${theme.colors.items.separator}`,
  },
  title: {
    ...dialogTitle(theme),
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    padding: `0px ${theme.spacing.md}`,
    gap: theme.spacing.md,
    '& input': {
      flex: 1,
      fontFamily: 'inherit',
      ...theme.typography.body,
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
  },
  actions: {
    ...dialogActions(theme),
  },
  label: {
    ...theme.typography.bodyBold,
    color: theme.colors.text.primary,
    cursor: 'help',
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    padding: '0px 0px',
    gap: theme.spacing.sm,
    '& > input': {
      height: '32px',
      padding: '10px 10px',
    },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
const selectTheme = (original: any) => ({
  ...original,
  backgroundColor: theme.colors.background.body,
  color: theme.colors.text.secondary,
  border: 'none',
  borderRadius: '4px',
  colors: {
    ...original.colors,
    primary25: theme.colors.select.accent,
    primary50: theme.colors.select.accent,
    primary75: theme.colors.select.accent,
    primary: theme.colors.select.accent,
  },
});

/**
 * Full screen modal dialog with the tutorial settings
 */
export default function TutorialSettings(): JSX.Element {
  const classes = useStyles();
  const dispatch = useDispatch();
  const {actions, selectors, lang} = useContext(AppContext);
  const sessionId = selectors.project.getSessionId();
  const {category, description, slug, version, isAuthoringTutorial} =
    selectors.project.getProjectInfo();

  const [metadata, setMetadata] = React.useState<ProjectMetadata>({
    category,
    description,
    slug,
    version,
  });

  React.useEffect(() => {
    if (sessionId) {
      setMetadata({
        category,
        description,
        slug,
        version,
      });
    } else {
      setMetadata({
        category: undefined,
        description: undefined,
        slug: undefined,
        version: undefined,
      });
    }
  }, [sessionId]);

  const tutorialCategoryOptions = [
    TutorialCategory.Beginner,
    TutorialCategory.Intermediate,
    TutorialCategory.Advanced,
  ].map(k => ({value: k, label: lang(`tutorial.categories.${k}`)}));

  const onChangeMetadata =
    (key: keyof ProjectMetadata) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setMetadata({...metadata, [key]: e.target.value});
    };

  const onChangeCategory = (option: any) => {
    setMetadata({...metadata, category: option.value});
  };

  const onDismiss = () => {
    dispatch(actions.app.showTutorialSettings({visible: false}));
  };

  const onConfirm = () => {
    dispatch(actions.project.updateMetadata({metadata}));
    dispatch(actions.app.showTutorialSettings({visible: false}));
  };

  React.useEffect(() => {
    if (!isAuthoringTutorial) onDismiss();
  }, [isAuthoringTutorial]);

  return (
    <div className={classes.background} onClick={onDismiss}>
      <div className={classes.dialog} onClick={e => e.stopPropagation()}>
        <div className={classes.header}>
          <h5 className={classes.title}>{lang('tutorial.settings')}</h5>
          <CloseButton
            onClick={() => onDismiss()}
            aria-label="Close Settings"
          />
        </div>
        <div className={classes.body}>
          <div className={classes.info}>
            <span className={classes.label}>Description:</span>
            <input
              data-testid="description-input"
              type="text"
              value={metadata.description ?? ''}
              onChange={onChangeMetadata('description')}
            />
          </div>
          <div className={classes.info}>
            <span className={classes.label}>Category:</span>
            <Select
              classNamePrefix="react-select"
              theme={selectTheme}
              value={
                tutorialCategoryOptions.find(
                  c => c.value === metadata.category,
                ) ?? tutorialCategoryOptions[0]
              }
              onChange={onChangeCategory}
              options={tutorialCategoryOptions}
              isSearchable={false}
            />
          </div>
          <div className={classes.info}>
            <span className={classes.label}>Slug:</span>
            <input
              data-testid="slug-input"
              type="text"
              value={metadata.slug ?? ''}
              onChange={onChangeMetadata('slug')}
            />
          </div>
          <div className={classes.info}>
            <span className={classes.label}>Version:</span>
            <input
              data-testid="version-input"
              type="text"
              value={metadata.version ?? ''}
              onChange={onChangeMetadata('version')}
            />
          </div>
        </div>
        <div className={classes.actions}>
          <button
            type="button"
            className="hsbutton borderless"
            onClick={onDismiss}>
            Cancel
          </button>
          <button type="button" className="hsbutton" onClick={onConfirm}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
