/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {useDispatch} from 'react-redux';
import {MainToRenderer} from '../../../../../shared';
import {
  typedOn,
  typedRemoveAllListeners,
} from '../../../../../shared/typed-ipc';

import {AppContext} from '../../../containers/App';
import {createAppStyle} from '../../../styles/theme.style';

import ExportIcon from '../../../images/export-icon.svg';

const useStyles = createAppStyle(theme => ({
  container: {
    width: '100%',
    height: '42px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background.primaryButton,
    color: theme.colors.text.dark,
    ...theme.typography.body,
    fontWeight: 600,
    letterSpacing: '0.2px',
    borderRadius: theme.sizes.borderRadius.card,
    border: 'none',
    '&.secondary': {
      background: theme.colors.button.secondary.main,
      color: theme.colors.text.pressed,
      '& img': {
        filter: 'invert(1)',
      },
      '&:hover': {
        background: theme.colors.button.secondary.hover,
      },
    },
  },
}));

/**
 * Export Button
 */
function ExportButton() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const {actions, selectors, lang} = React.useContext(AppContext);
  const clips = selectors.project.getClips();
  const selectedClips = selectors.project.getSelectedClips();
  const clipIds = selectors.project.getClipIds();
  const exportDialog = selectors.app.getExportDialog();

  const isExportOpen = exportDialog.open && exportDialog.status !== 'success';

  const exportEnabled = React.useMemo(
    () =>
      selectedClips.some(
        c =>
          clips[c] &&
          ((clips[c].state.present.haptic?.signals.continuous.envelopes
            .amplitude.length || 0) > 1 ||
            (clips[c].state.present.haptic?.signals.continuous.envelopes
              .frequency?.length || 0) > 1),
      ),
    [clips, selectedClips],
  );

  const onExport = (data: string[]) => {
    dispatch(actions.app.showExportDialog({clips: data}));
  };

  const onExportConfirm = () => {
    dispatch(
      actions.app.confirmExport({
        clips: selectedClips,
        formats: exportDialog.formats,
        packageProject: exportDialog.packageProject,
        flatten: exportDialog.flatten,
      }),
    );
  };

  React.useEffect(() => {
    typedRemoveAllListeners(MainToRenderer.ExportAllClips);
    typedOn(MainToRenderer.ExportAllClips, () => {
      dispatch(actions.project.selectAllClips());
      void onExport(clipIds);
    });
    dispatch(actions.app.toggleMenuItems({export_all: clipIds.length > 0}));
  }, [clipIds]);

  React.useEffect(() => {
    typedRemoveAllListeners(MainToRenderer.ExportClips);
    typedOn(MainToRenderer.ExportClips, () => {
      void onExport(selectedClips);
    });
    typedRemoveAllListeners(MainToRenderer.DuplicateClips);
    typedOn(MainToRenderer.DuplicateClips, () => {
      dispatch(actions.project.duplicateSelectedClip());
    });
    dispatch(actions.app.toggleMenuItems({export: exportEnabled}));
  }, [selectedClips, exportEnabled]);

  return clipIds.length === 0 ? null : (
    <button
      type="button"
      disabled={!exportEnabled}
      className={`${classes.container} ${isExportOpen ? '' : 'secondary'}`}
      onClick={() =>
        isExportOpen ? onExportConfirm() : onExport(selectedClips)
      }>
      <img src={ExportIcon} alt={lang('export.title')} />
      <span>
        {isExportOpen
          ? lang('export.save-clips', {smart_count: selectedClips.length})
          : lang('export.export-and-package')}
      </span>
    </button>
  );
}

export default React.memo(ExportButton);
