/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createAppStyle} from './theme.style';

export default createAppStyle(theme => ({
  // global styles
  '@global': {
    '*': {
      boxSizing: 'border-box',
      outline: 0,
    },

    '#app, .app-container, html, body': {
      fontFamily: theme.fonts.body,
      fontWeight: 'normal',
      lineHeight: '1.2rem',
      color: theme.colors.text.primary,
      width: '100%',
      height: '100%',
      margin: 0,
      padding: 0,
      userSelect: 'none',
      position: 'relative',
      overflow: 'auto',
      background: theme.colors.background.dark,
    },

    '.headline, h1, h2, h3, h4, h5, h6': {
      fontFamily: theme.fonts.heading,
    },

    '.error-boundary-container': {
      height: '100%',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontSize: '18px',
      color: theme.colors.text.primary,
      fontWeight: 500,
      lineHeight: '24px',
      whiteSpace: 'pre-line',
      textAlign: 'center',
      gap: '16px',
    },

    '.error-boundary-action': {
      background: 'white',
      color: 'black',
      padding: '10px',
      width: '200px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },

    '.title': {
      fontFamily: theme.fonts.body,
      fontSize: '1rem',
    },

    '.category': {
      fontFamily: theme.fonts.body,
      fontWeight: 500,
      fontSize: '10px',
      lineHeight: '16px',
    },

    '.indicator': {
      width: '10px',
      height: '10px',
      borderRadius: '16px',
      backgroundColor: theme.colors.primary.main,
    },

    '.hsbutton': {
      position: 'relative',
      '-webkit-app-region': 'no-drag',
      display: 'flex',
      alignItems: 'center',
      flexShrink: 0,
      gap: '8px',
      minHeight: '30px',
      minWidth: '30px',
      justifyContent: 'center',
      fontFamily: theme.fonts.heading,
      border: 'none',
      fontWeight: 600,
      letterSpacing: '0.2px',
      textAlign: 'center',
      background: theme.colors.button.primary.main,
      borderRadius: '4px',
      padding: '5px 10px',
      color: '#272727',
      fontSize: '14px',
      lineHeight: '20px',
      transition: 'all 0.1s linear',
      '& img': {
        width: '20px',
        height: '20px',
        objectFit: 'contain',
      },
      '&.icon': {
        padding: '5px',
      },
      '&.icon-start': {
        paddingLeft: '4px',
        gap: '4px',
      },
      '&.icon-end': {
        paddingRight: '4px',
        gap: '4px',
      },
      '&.big': {
        padding: '12px 16px',
      },
      '&:hover': {
        background: theme.colors.button.primary.hover,
      },
      '&.disabled': {
        background: theme.colors.button.primary.disabled,
        pointerEvents: 'none',
      },
      '&.secondary': {
        background: theme.colors.button.secondary.main,
        color: 'white',
        '&:hover': {
          background: theme.colors.button.secondary.hover,
        },
        '&.disabled': {
          background: theme.colors.button.secondary.disabled,
        },
        '&.inverted': {
          background: theme.colors.text.primary,
          color: theme.colors.background.dark,
          '&:hover': {
            background: '#E4E6EB',
          },
        },
      },
      '&.square': {
        padding: '5px',
      },
      '&.borderless': {
        background: theme.colors.button.borderless.main,
        color: theme.colors.text.primary,
        '&.secondary': {
          color: 'rgba(255, 255, 255, 0.9)',
          '& img': {
            opacity: 0.9,
          },
        },
        '&:hover:not(.nohover)': {
          background: theme.colors.button.borderless.hover,
          '&.dark': {
            background: '#FFFFFF14',
          },
        },
        '&.disabled': {
          background: theme.colors.button.borderless.disabled,
        },
      },
      '&.unchecked': {
        opacity: 0.6,
        '&:hover': {
          opacity: 0.8,
        },
      },
      '&.indicator-top-right:after': {
        content: '" "',
        width: '10px',
        height: '10px',
        borderRadius: '16px',
        backgroundColor: theme.colors.primary.main,
        position: 'absolute',
        top: '-3px',
        right: '-3px',
      },
      '&.indicator-top-left:before': {
        content: '" "',
        width: '10px',
        height: '10px',
        borderRadius: '16px',
        backgroundColor: theme.colors.primary.main,
        position: 'absolute',
        top: '-3px',
        left: '-3px',
      },
      '&.indicator-bottom-right:after': {
        content: '" "',
        width: '10px',
        height: '10px',
        borderRadius: '16px',
        backgroundColor: theme.colors.primary.main,
        position: 'absolute',
        bottom: '-3px',
        right: '-3px',
      },
      '&.indicator-bottom-left:before': {
        content: '" "',
        width: '10px',
        height: '10px',
        borderRadius: '16px',
        backgroundColor: theme.colors.primary.main,
        position: 'absolute',
        bottom: '-3px',
        left: '-3px',
      },
    },

    button: {
      fontFamily: theme.fonts.heading,
    },

    '.button': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: theme.fonts.body,
      border: 'none',
      fontWeight: 'bold',
      textAlign: 'center',
      '&.large': {
        height: '40px',
        fontSize: '1rem',
        lineHeight: '1rem',
        padding: '12px 20px',
      },
      '&.medium': {
        height: '32px',
        fontSize: '0.75rem',
        lineHeight: '0.75rem',
        padding: '8px 12px',
      },
      '&.color': {
        color: '#000',
        background: '#FFA800',
        '&:hover': {
          background: '#FBB449',
        },
      },
      '&.grey': {
        color: '#000',
        background: '#D9E1E2',
        '&:hover': {
          background: '#EFF3F3',
        },
      },
      '&.secondary-color': {
        color: '#FFA800',
        border: '1px solid #FFA800',
        background: 'transparent',
        '&:hover': {
          color: '#FBB449',
          border: '1px solid #FBB449',
        },
      },
      '&.secondary-grey': {
        color: '#D9E1E2',
        border: '1px solid #D9E1E2',
        background: 'transparent',
        '&:hover': {
          color: '#EFF3F3',
          border: '1px solid #EFF3F3',
          filter: 'brightness(1.2)',
        },
      },
      '&.tertiary-color': {
        color: '#FFA800',
        background: 'transparent',
        '&:hover': {
          color: '#FBB449',
        },
      },
      '&.tertiary-grey': {
        color: '#D9E1E2',
        background: 'transparent',
        '&:hover': {
          color: '#EFF3F3',
        },
      },
      '&.with-icon': {
        padding: '8px 18px 8px 12px',
      },
    },

    'button.disabled': {
      opacity: 0.6,
    },

    // Slider

    '.slider-track': {
      height: '12px',
      backgroundColor: 'red',
      borderRadius: '6px',
    },

    '.slider-track-1': {
      height: '12px',
      backgroundColor: '#2E3033',
      borderRadius: '6px',
    },

    // Select

    '.react-select__control': {
      height: '40px',
      background: `${theme.colors.input.background} !important`,
      borderRadius: `${theme.sizes.borderRadius.card} !important`,
      borderWidth: '1px !important',
      borderColor: `${theme.colors.input.border} !important`,
    },

    '.react-select__control:hover, .react-select__control--is-focused': {
      borderColor: `${theme.colors.input.borderFocused} !important`,
    },

    '.react-select__menu': {
      background: `${theme.colors.input.background} !important`,
      borderRadius: `${theme.sizes.borderRadius.card} !important`,
      overflow: 'hidden',
      padding: '8px',
    },

    '.react-select__option': {
      borderRadius: `${theme.sizes.borderRadius.card} !important`,
    },

    '.react-select__single-value': {
      color: `${theme.colors.text.primary} !important`,
      fontSize: '14px !important',
      lineHeight: '20px',
      borderRadius: `${theme.sizes.borderRadius.card} !important`,
    },

    '.react-select__indicator-separator': {
      opacity: 0,
    },

    '.react-select__menu-list': {
      padding: '0 !important',
      borderRadius: `${theme.sizes.borderRadius.card} !important`,
    },

    // Scrollbar

    '.scrollbar::-webkit-scrollbar': {
      width: '4px',
    },

    '.scrollbar::-webkit-scrollbar-track': {
      background: theme.colors.background.dark,
    },

    '.scrollbar::-webkit-scrollbar-thumb': {
      background: 'white',
      borderRadius: '5px',
      padding: '2px',
    },

    '.scrollbar::-webkit-scrollbar-thumb:hover': {
      background: theme.colors.background.detail,
    },

    '.scrollbar::-webkit-scrollbar-thumb:active': {
      background: theme.colors.background.detail,
    },

    '.react-select__option--is-selected:not(.react-select__option--is-focused)':
      {
        backgroundColor: '#0000 !important',
      },

    // Animations

    '@keyframes rotate': {
      '0%': {transform: 'rotate(0deg)'},
      '100%': {transform: 'rotate(360deg)'},
    },

    '.slide-enter': {
      transform: 'translateY(100px)',
    },

    '.slide-enter.slide-enter-active': {
      transform: 'none',
      transition: 'transform 200ms ease-in',
    },

    '.slide-exit': {
      transform: 'none',
    },

    '.slide-exit.slide-exit-active': {
      transform: 'translateY(100px)',
      transition: 'transform 200ms ease-in',
    },

    '.slideFade-enter': {
      transform: 'translateY(100px)',
      opacity: 0,
    },

    '.slideFade-enter.slideFade-enter-active': {
      transform: 'none',
      opacity: 1,
      transition: 'transform 200ms ease-in, opacity 200ms ease-in',
    },

    '.slideFade-exit': {
      transform: 'none',
      opacity: 1,
    },

    '.slideFade-exit.slideFade-exit-active': {
      transform: 'translateY(100px)',
      opacity: 0,
      transition: 'transform 200ms ease-in, opacity 200ms ease-in',
    },

    '.fade-enter': {
      opacity: 0,
    },

    '.fade-enter.fade-enter-active': {
      opacity: 1,
      transition: 'transform 200ms ease-in, opacity 200ms ease-in',
    },

    '.fade-exit': {
      opacity: 1,
    },

    '.fade-exit.fade-exit-active': {
      opacity: 0,
      transition: 'transform 200ms ease-in, opacity 200ms ease-in',
    },

    '.markdown': {
      fontFamily: theme.fonts.body,
      color: '#FFFFFF99',
      fontSize: '14px',
      lineHeight: '18px',
      fontWeight: 400,
      '& a': {
        color: '#E4E6EB',
        textDecoration: 'none',
      },
      '& h1': {
        color: '#E4E6EB',
        fontSize: '16px',
        lineHeight: '20px',
        fontWeight: 500,
        marginTop: '8px',
      },
      '& h2': {
        color: '#E4E6EB',
        fontSize: '14px',
      },
      '& h3': {
        color: '#E4E6EB',
        fontSize: '12px',
      },
      '& h4': {
        color: '#E4E6EB',
        fontSize: '10px',
      },
      '& .buttons': {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '8px',
      },
      '& .button': {
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        gap: '8px',
        height: '30px',
        minWidth: '30px',
        justifyContent: 'center',
        fontFamily: theme.fonts.heading,
        border: 'none',
        fontWeight: 600,
        textAlign: 'center',
        background: theme.colors.button.primary.main,
        borderRadius: '6px',
        padding: '5px 10px',
        color: '#E4E6EB',
        fontSize: '14px',
        lineHeight: '20px',
        transition: 'all 0.1s linear',
        '&.secondary': {
          background: theme.colors.button.secondary.main,
          '&:hover': {
            background: theme.colors.button.secondary.hover,
          },
          '&.disabled': {
            background: theme.colors.button.secondary.disabled,
          },
        },
        '&.next': {
          marginLeft: 'auto',
        },
      },
    },

    '.rldsspacer': {
      height: '1px',
      width: '100%',
      boxShadow: theme.shadows.input,
    },

    '.invert': {
      filter: 'invert(1)',
    },
  },
}));
