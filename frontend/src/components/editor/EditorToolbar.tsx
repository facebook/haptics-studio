/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/restrict-template-expressions */
import React from 'react';
import {useDispatch} from 'react-redux';
import {useSpring, animated} from '@react-spring/web';
import {v4 as uuidv4} from 'uuid';

import {createAppStyle, theme} from '../../styles/theme.style';
import {ZIndex} from '../../styles/zIndex';
import {EnvelopeType, FocusArea} from '../../state/types';
import {AppContext} from '../../containers/App';
import {useKeyboardEvent} from '../../hooks/useKeyboardEvent';
import Constants from '../../globals/constants';
import {Tool} from '../../state/editingTools/types';
import Tooltip from '../common/Tooltip';

const ToolIcons = {
  [Tool.Cursor]: require('../../images/tool-icon-cursor.svg'),
  [Tool.Emphasis]: require('../../images/tool-icon-emphasis.svg'),
  [Tool.Markers]: require('../../images/tool-icon-marker.svg'),
  [Tool.Pen]: require('../../images/tool-icon-pen.svg'),
  [Tool.Trim]: require('../../images/tool-icon-trim.svg'),
};

const Tools = [Tool.Cursor, Tool.Pen, Tool.Emphasis, Tool.Markers, Tool.Trim];

const useStyles = createAppStyle(theme => ({
  container: {
    position: 'relative',
    zIndex: ZIndex.Toolbar,
    display: 'flex',
    height: `${Constants.toolbar.height}px`,
    alignItems: 'center',
    padding: `5px ${Constants.toolbar.horizontalPadding}px`,
  },
  disabled: {
    pointerEvents: 'none',
    opacity: 0.5,
  },
  bar: {
    position: 'relative',
    flexShrink: 0,
    display: 'flex',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.sizes.borderRadius.card,
  },
  tools: {
    borderRadius: theme.sizes.borderRadius.card,
    backgroundColor: theme.colors.background.light,
    display: 'flex',
    position: 'absolute',
    alignItems: 'center',
    top: '0px',
    right: '5px',
    bottom: '0px',
    padding: '8px',
    gap: '4px',
    '& span': {
      borderRadius: theme.sizes.borderRadius.card,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '32px',
      height: '28px',
      '& img': {
        width: '22px',
      },
      '&:hover': {
        backgroundColor: theme.colors.background.hover,
      },
      '&.selected': {
        backgroundColor: 'white',
        '& img': {
          filter: 'invert(1)',
        },
      },
    },
  },
  switch: {
    display: 'flex',
    position: 'relative',
    alignItems: 'center',
    height: '34px',
    borderRadius: '17px',
    backgroundColor: theme.colors.background.light,
    color: theme.colors.text.primary,
    gap: '-20px',
    '& div': {
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      height: '100%',
      flex: 1,
      fontSize: '12px',
      lineHeight: '12px',
      fontWeight: 600,
      letterSpacing: '0.2px',
      padding: '0 24px',
      zIndex: 1,
      '&:hover': {
        '& .hover': {
          opacity: 1,
        },
      },
      '& .hover': {
        background: '#545454',
        opacity: 0,
      },
      '& span': {
        zIndex: 2,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      },
      '& aside': {
        position: 'absolute',
        top: '5px',
        bottom: '5px',
        left: '5px',
        right: '5px',
        zIndex: 0,
        borderRadius: '12px',
      },
    },
  },
}));

type HoverType = 'amplitude' | 'frequency' | Tool;

const Shortcuts = {
  v: Tool.Cursor,
  e: Tool.Emphasis,
  m: Tool.Markers,
  p: Tool.Pen,
  t: Tool.Trim,
};
const ToolLabels = Object.fromEntries(
  Object.entries(Shortcuts).map(([key, value]) => [value, key]),
);

/**
 * Toolbar with the envelope toggle and other editing tools
 */
function EditorToolbar(props: {className?: string}) {
  const classes = useStyles();
  const dispatch = useDispatch();
  const toolsContainer = React.useRef<HTMLDivElement>();
  const {actions, selectors, lang} = React.useContext(AppContext);
  const [hoveredTool, setHoveredTool] = React.useState<HoverType | undefined>(
    undefined,
  );

  const visibility = selectors.app.getVisibility();
  const activeTool = selectors.editingTools.getActiveTool();
  const currentClipId = selectors.project.getCurrentClipId();
  const focus = selectors.app.getFocus();
  const defaultControlEnabled = selectors.app.getDefaultControlStatus();
  const duration = selectors.project.getCurrentClipOriginalDuration();
  const trimTime = selectors.editingTools.getTrimTime();

  const amplitudeSpring = useSpring({
    transform:
      visibility.envelope === EnvelopeType.Amplitude
        ? 'scale(1.0)'
        : 'scale(0.95)',
    opacity: visibility.envelope === EnvelopeType.Amplitude ? 1 : 0,
  });

  const frequencySpring = useSpring({
    transform:
      visibility.envelope === EnvelopeType.Frequency
        ? 'scale(1.0)'
        : 'scale(0.95)',
    opacity: visibility.envelope === EnvelopeType.Frequency ? 1 : 0,
  });

  const springs = {
    amplitude: amplitudeSpring,
    frequency: frequencySpring,
  };

  const onKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (defaultControlEnabled) return;

      switch (e.key) {
        case 'Escape':
          if (focus === FocusArea.Plot) {
            dispatch(
              actions.project.setSelectedPoints({
                points: [],
                emphasis: undefined,
              }),
            );
          }
          onToolChange(Tool.Cursor);
          break;
        case 'Enter':
          if (activeTool === Tool.Pen) {
            dispatch(actions.editingTools.cancelPenEdit());
          }
          break;
        case 'f':
          dispatch(
            actions.app.setSelectedEnvelope({
              envelope:
                visibility.envelope === EnvelopeType.Amplitude
                  ? EnvelopeType.Frequency
                  : EnvelopeType.Amplitude,
            }),
          );
          break;
        default:
          break;
      }
      if (e.key in Shortcuts) {
        onToolChange(Shortcuts[e.key as keyof typeof Shortcuts]);
      }
    },
    [visibility.envelope, activeTool, focus, defaultControlEnabled],
  );
  useKeyboardEvent('keydown', onKeyDown);

  const onToggleSelected = () => {
    if (activeTool === Tool.Pen) {
      dispatch(actions.editingTools.cancelPenEdit());
    }
    if (currentClipId) {
      const envelope =
        visibility.envelope === EnvelopeType.Amplitude
          ? EnvelopeType.Frequency
          : EnvelopeType.Amplitude;
      dispatch(actions.app.setSelectedEnvelope({envelope}));
      if (activeTool === Tool.Pen) {
        dispatch(
          actions.editingTools.enablePen({clipId: currentClipId, envelope}),
        );
      }
    }
  };

  const onToolChange = React.useCallback(
    (tool: Tool) => {
      if (tool === activeTool) return;

      switch (tool) {
        case Tool.Cursor:
          dispatch(actions.editingTools.enableSelect());
          break;
        case Tool.Pen:
          if (currentClipId) {
            dispatch(
              actions.editingTools.enablePen({
                clipId: currentClipId,
                envelope: visibility.envelope,
              }),
            );
          } else {
            const clipId = uuidv4();
            if (!currentClipId) {
              dispatch(actions.project.createEmptyClip({clipId}));
            }
          }
          break;
        case Tool.Emphasis:
          dispatch(actions.editingTools.enableEmphasis());
          // @oss-disable
          // @oss-disable
            // @oss-disable
          // @oss-disable
          break;
        case Tool.Markers:
          dispatch(actions.editingTools.enableMarkers());
          break;
        case Tool.Trim:
          dispatch(actions.editingTools.enableTrim({duration, time: trimTime}));
          break;
        default:
          break;
      }
    },
    [currentClipId, visibility.envelope, activeTool],
  );

  let tooltipPosition = 0;
  if (toolsContainer.current) {
    const rect = toolsContainer.current.getBoundingClientRect();
    tooltipPosition = rect.top + rect.height;
  }

  return (
    <section
      data-testid="editor-toolbar"
      className={`${currentClipId ? '' : classes.disabled} ${classes.container} ${!currentClipId ? 'disabled' : ''} ${props.className || ''}`}
      style={hoveredTool ? {zIndex: ZIndex.Menu} : {}}>
      <div className={classes.bar}>
        <div className={classes.switch} onClick={() => onToggleSelected()}>
          {(['amplitude', 'frequency'] as ('amplitude' | 'frequency')[]).map(
            type => (
              <div key={type} className={type}>
                <span
                  onMouseEnter={() => setHoveredTool(type)}
                  onMouseLeave={() => setHoveredTool(undefined)}>
                  {lang(`editor.visibility-toggle-${type}`)}
                  {hoveredTool === type ? (
                    <Tooltip
                      text={lang('editor.tool-tooltip.envelope')}
                      shortcut="F"
                      top={tooltipPosition}
                    />
                  ) : null}
                </span>
                <aside className="hover" />
                <animated.aside
                  style={{
                    ...springs[type],
                    backgroundColor: theme.colors.plot[type],
                  }}
                />
              </div>
            ),
          )}
        </div>

        <div className={classes.tools} ref={toolsContainer as any}>
          {Tools.map(tool => (
            <span
              key={tool.toString()}
              data-testid={`editor-toolbar-tool-${tool.toString()}`}
              className={`icon ${activeTool === tool ? 'selected' : ''}`}
              onClick={() => onToolChange(tool)}
              onMouseEnter={() => setHoveredTool(tool)}
              onMouseLeave={() => setHoveredTool(undefined)}>
              <img src={ToolIcons[tool]} alt={tool.toString()} />
              {hoveredTool === tool ? (
                <Tooltip
                  text={lang(`editor.tool-tooltip.${tool}`)}
                  shortcut={ToolLabels[tool].toUpperCase()}
                  top={tooltipPosition}
                />
              ) : null}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

EditorToolbar.defaultProps = {
  className: '',
};

export default React.memo(EditorToolbar);
