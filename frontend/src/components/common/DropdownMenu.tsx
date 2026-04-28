/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useContext} from 'react';
import {createPortal} from 'react-dom';
import {useTransition, animated} from '@react-spring/web';
import {AppContext} from '../../containers/App';
import {createAppStyle} from '../../styles/theme.style';
import {ZIndex} from '../../styles/zIndex';
import {
  overlayBase,
  menuBase,
  menuSeparator,
  sectionHeader,
} from '../../styles/shared.styles';

const useStyles = createAppStyle(theme => ({
  background: {
    '-webkit-app-region': 'no-drag',
    ...overlayBase,
    background: '#0000',
    zIndex: ZIndex.Menu,
  },
  header: {
    ...sectionHeader(theme),
    fontWeight: 500,
    margin: `${theme.spacing.sm} ${theme.spacing.md} ${theme.spacing.xs}`,
    opacity: 0.8,
  },
  menu: {
    '-webkit-app-region': 'no-drag',
    ...menuBase(theme),
    background: theme.colors.select.background,
    '& div.item': {
      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
      display: 'flex',
      ...theme.typography.bodyBold,
      borderRadius: theme.sizes.borderRadius.card,
      alignItems: 'center',
      justifyContent: 'flex-start',
      color: theme.colors.text.primary,
      '& img': {
        height: '16px',
        width: '16px',
        marginRight: theme.spacing.md,
        opacity: 0.6,
      },
      '& span.title': {
        marginRight: 'auto',
      },
      '& aside': {
        marginLeft: '32px',
      },
      '&:hover': {
        background: theme.colors.select.accent,
        color: theme.colors.text.pressed,
        '& img': {
          opacity: 1,
        },
      },
    },
  },
  disabled: {
    opacity: 0.4,
  },
  separator: {
    ...menuSeparator(theme),
    backgroundColor: theme.colors.select.separator,
  },
}));

interface MenuAction {
  label: string;
  buttonTitle?: string;
  onClick: () => void;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  header?: string;
  separator?: boolean;
}

interface Props {
  children: JSX.Element;
  items: MenuAction[];
}

function DropdownMenu(props: Props) {
  const classes = useStyles();
  const {selectors} = useContext(AppContext);
  const {items} = props;
  const windowInfo = selectors.app.getWindowInformation();
  const triggerRef = React.useRef<HTMLDivElement>(null);

  const [menuPosition, setMenuPosition] = React.useState<{
    x: number;
    y: number;
  }>();

  const onOpen = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPosition({x: rect.left, y: rect.bottom});
    }
  };

  const onDismiss = (callback?: () => any) => {
    callback?.();
    setMenuPosition(undefined);
  };

  const transitions = useTransition(menuPosition, {
    from: {opacity: 0, zIndex: ZIndex.Menu},
    enter: {opacity: 1, zIndex: ZIndex.Menu},
  });

  const swapHor = menuPosition && menuPosition.x + 200 > windowInfo.size[0];
  const swapVer =
    menuPosition && menuPosition.y > (windowInfo.size[1] * 60) / 100;

  return (
    <>
      <div ref={triggerRef} onClick={onOpen} style={{display: 'inline-block'}}>
        {props.children}
      </div>
      {menuPosition
        ? createPortal(
            transitions(style => (
              <animated.div
                style={{...style, zIndex: ZIndex.Menu}}
                className={classes.background}
                onClick={() => onDismiss()}
                onContextMenu={() => onDismiss()}>
                <div
                  className={classes.menu}
                  style={{
                    top: swapVer ? 'unset' : menuPosition.y,
                    bottom: swapVer
                      ? windowInfo.size[1] - menuPosition.y
                      : 'unset',
                    left: swapHor ? 'unset' : menuPosition.x,
                    right: swapHor
                      ? windowInfo.size[0] - menuPosition.x
                      : 'unset',
                  }}
                  onClick={event => event.stopPropagation()}>
                  {items.map((item, index) => (
                    <React.Fragment key={`fragment_${index}`}>
                      {item.header ? (
                        <span
                          className={classes.header}
                          key={`header_${index}`}>
                          {item.header}
                        </span>
                      ) : null}
                      <div
                        key={index}
                        className={`item ${item.disabled ? classes.disabled : ''}`}
                        onClick={
                          item.disabled
                            ? undefined
                            : onDismiss.bind(null, item.onClick)
                        }>
                        {item.icon ? <img src={item.icon} /> : null}
                        <span className="label" title={item.buttonTitle}>
                          {item.label}
                        </span>
                        {item.shortcut ? <aside>{item.shortcut}</aside> : null}
                      </div>
                      {item.separator ? (
                        <div
                          key={`separator_${index}`}
                          className={classes.separator}
                        />
                      ) : null}
                    </React.Fragment>
                  ))}
                </div>
              </animated.div>
            )),
            document.body,
          )
        : null}
    </>
  );
}

export default React.memo(DropdownMenu);
