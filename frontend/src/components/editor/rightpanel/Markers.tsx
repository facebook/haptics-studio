/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable react/no-danger */
import {useDispatch} from 'react-redux';
import React from 'react';
import {AppContext} from '../../../containers/App';
import {createAppStyle} from '../../../styles/theme.style';
import {timeFormat} from '../../../globals/utils';
import {ClipMarker} from '../../../state/types';

const useStyles = createAppStyle(theme => ({
  container: {
    backgroundColor: theme.colors.background.dark,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    ...theme.typography.body,
    padding: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  marker: {
    height: 'auto',
    width: '100%',
    borderRadius: theme.sizes.borderRadius.card,
    padding: '6px 8px 0px 12px',
    whiteSpace: 'pre-wrap',
    '& section': {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    '& textarea': {
      backgroundColor: theme.colors.input.background,
      borderRadius: theme.sizes.borderRadius.card,
      padding: `${theme.spacing.sm} ${theme.spacing.md} ${theme.spacing.md}`,
      margin: `${theme.spacing.sm} 0px ${theme.spacing.lg} 0px`,
      fontFamily: 'inherit',
      ...theme.typography.body,
      width: '100%',
      boxSizing: 'border-box',
      border: `1px solid ${theme.colors.input.border}`,
      resize: 'none',
      transition: 'all .1s',
      color: theme.colors.text.secondary,
      '&:focus': {
        color: theme.colors.text.primary,
        borderColor: theme.colors.background.detail,
      },
    },
  },
  highlight: {
    backgroundColor: theme.colors.background.body,
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '4px',
  },
  markerText: {
    width: '100%',
    padding: `${theme.spacing.xs} 0px ${theme.spacing.lg}`,
    ...theme.typography.body,
    lineHeight: '16px',
    color: theme.colors.text.secondary,
    paddingRight: theme.spacing.xs,
  },
  time: {
    ...theme.typography.bodyBold,
    color: theme.colors.text.primary,
  },
  empty: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    padding: `0px ${theme.spacing.md} ${theme.spacing.lg}`,
  },
  actions: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${theme.spacing.sm} 0px`,
    gap: theme.spacing.sm,
  },
  title: {
    ...theme.typography.bodyBold,
    color: theme.colors.text.primary,
    margin: 0,
  },
  tip: {
    width: '100%',
    color: theme.colors.text.secondary,
    whiteSpace: 'pre-line',
    ...theme.typography.body,
    lineHeight: '24px',
    textAlign: 'left',
    marginBottom: '0px',
    '& *': {
      display: 'inline',
      alignItems: 'left',
    },
    '& img': {
      verticalAlign: 'sub',
      width: '18px',
      height: '18px',
      margin: '0px 2px 0px',
    },
  },
}));

/**
 * Right panel with the clip markers
 */
function Markers() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const {selectors, actions, lang} = React.useContext(AppContext);

  const markers = selectors.project.getMarkers();
  const selectedMarkerId = selectors.editingTools.getSelectedMarkerId();
  const editingMarker = selectors.editingTools.getEditingMarker();

  const [markerName, setMarkerName] = React.useState<string | undefined>();
  const elementBookmark = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (editingMarker) {
      setMarkerName(editingMarker.name);
    }
  }, [editingMarker]);

  const onEdit = (marker: ClipMarker) => {
    setMarkerName(marker.name);
    dispatch(actions.editingTools.editMarker({marker}));
  };

  const onSave = () => {
    if (editingMarker) {
      dispatch(
        actions.project.updateMarker({
          markerId: editingMarker.id,
          name: markerName,
        }),
      );
      setMarkerName(undefined);
    }
  };

  const onDelete = (markerId: string) => {
    dispatch(actions.project.deleteMarker({markerId}));
  };

  const onKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter') {
      onSave();
    }
  };

  const onKeyUp = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape') {
      onSave();
    }
  };

  return (
    <div className={classes.container}>
      {markers.length > 0 ? (
        markers.map((marker, index) => {
          return (
            <div
              id={marker.id}
              className={`${classes.marker} ${marker.id === selectedMarkerId ? classes.highlight : ''}`}
              key={`marker-${index}`}
              onClick={() =>
                dispatch(
                  actions.editingTools.selectMarker({markerId: marker.id}),
                )
              }>
              {marker.id === selectedMarkerId ? (
                <div ref={elementBookmark} />
              ) : null}
              <section>
                <span className={classes.time}>
                  {timeFormat(marker.time, true)}
                </span>
                <div className={classes.toolbar}>
                  <button
                    type="button"
                    className="hsbutton icon borderless unchecked"
                    data-testid="delete-marker"
                    onClick={() => onDelete(marker.id)}>
                    <img
                      src={require('../../../images/icon-delete.svg')}
                      style={{width: '18px', height: '18px'}}
                    />
                  </button>
                </div>
              </section>
              {marker.id === editingMarker?.id ? (
                <div>
                  <textarea
                    autoFocus
                    value={markerName}
                    rows={2}
                    onChange={e => setMarkerName(e.target.value)}
                    onFocus={e => e.target.select()}
                    onBlur={onSave}
                    onKeyPress={onKeyPress}
                    onKeyUp={onKeyUp}
                  />
                </div>
              ) : (
                <div
                  className={classes.markerText}
                  onDoubleClick={() => onEdit(marker)}>
                  {marker.name}
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div className={classes.empty}>
          <div className={classes.actions}>
            <span className={classes.title}>{lang('markers.empty-title')}</span>
          </div>
          <div className={classes.tip}>
            <span>{lang('markers.instructions')}</span>
            <img
              src={require('../../../images/icon-marker.svg')}
              style={{marginRight: '6px'}}
            />
            <span>{lang('markers.instructions-hint')}</span>
          </div>
          {/* <button
            type="button"
            className="hsbutton secondary"
            style={{ marginTop: '8px' }}
            onClick={() => dispatch(actions.editingTools.enableMarkers())}
          >
            {lang('markers.instructions-button')}
          </button> */}
        </div>
      )}
    </div>
  );
}

export default React.memo(Markers);
