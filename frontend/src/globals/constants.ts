/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* Plot appearance */

const Constants = Object.freeze({
  plot: Object.freeze({
    // Margins of the area where the envelope is drawn
    margin: Object.freeze({
      top: 56,
      right: 0,
      bottom: 10,
      left: 40,
      vertical: () => Constants.plot.margin.top + Constants.plot.margin.bottom,
      horizontal: () =>
        Constants.plot.margin.left + Constants.plot.margin.right,
    }),
    point: {
      radius: 3.5,
      hoverRadius: 5,
      grabRadius: 10,
    },
    grid: {
      verticalSubdivisions: 5,
      // The minimum time span between vertical divisions in the envelope background grid
      minimumTimeSpan: 0.05,
      // The maximum amount of vertical division that will be shown in the envelope background grid. If the limit is reached, the timespan is increased
      maximumTicks: 10,
      // The number of subdivisions between two time dividers
      subTicksCount: 10,
      markersArea: {
        height: 18,
        diamondSize: 10,
      },
    },
    decimation: {
      threshold: 1000,
      epsilon: 0.01,
    },
    emphasis: {
      width: 8,
      iconWidth: 8,
      mouseTargetWidth: 20,
    },
  }),
  toolbar: Object.freeze({
    height: 50,
    horizontalPadding: 20,
    verticalPadding: 4,
  }),
  timeline: Object.freeze({
    height: 60,
    borderRadius: 5,
    horizontalPadding: 20,
    verticalPadding: 8,
    handleSize: 14,
    startingWindowSamples: 30,
    maximumWindowSamples: 800,
    minimumZoomTime: 0.1,
    extensionStep: 0.05,
    editExtension: 0.5,
    minimumClipDuration: 0.1,
    minimumCursorSize: 20,
  }),
  editing: Object.freeze({
    defaultConstantEnvelopeValue: 0.1,
  }),
  trim: Object.freeze({
    lockTrimmedArea: false,
  }),
  panels: {
    sidePanelMinWidth: 240,
    sidePanelMaxWidth: 460,
    tutorialPanelMinWidth: 320,
    tutorialPanelMaxWidth: 460,
  },
});
export default Constants;

// Height of the area with the playhead cursor and marker indicators
export const PlayheadToolbarHeight = 50;
// The undo history size, the oldest edit will be discarded when the limit is reached
export const UndoHistorySize = 100;
// The minimum time spacing between two samples (used to keep points separated during editing, avoiding two points at the same x)
export const MinimumTimeSpacing = 0.000005;
// The radius used to determine whether to show the "Add point" ghost when the mouse is near an envelope segment
export const AddPointHoverThreshold = 30;
// The amount of time that is added/removed when editing a selected point with the arrow keys
export const KeyboardHorizontalMovement = 0.002;
// The amount of amplitude that is added/removed when editing a selected point with the arrow keys
export const KeyboardVerticalMovement = 0.02;
// The modifier applied by pressing shift while editing a point
export const KeyboardShiftMultiplier = 5;
// The default values applied to the frequency when picking emphasis type
export const EmphasisSharpValue = 0.9;
export const EmphasisMediumValue = 0.5;
export const EmphasisRoundValue = 0.1;
// Enable the emphasis fine tuning
export const EmphasisSliderEnabled = true;
// Factor that slows down the wheel scrolling
export const MouseWheelSlowdown = 500;
// Factor that slows down the wheel/pinch zooming
export const ZoomGestureSlowdown = 200;
// Time in seconds for the error banner
export const SnackbarAutoDismissTime = 5;
// Right Panel closed width
export const ClosedSidePanelWidth = 48;
// Selection Bounding box padding area
export const BoundingBoxPadding = 10;
// Amplitude/Frequency step value for the detail editing panel
export const DetailEditingStep = 0.05;
// Default clip duration in seconds, used when creating a new empty clip
export const DefaultEmptyClipDuration = 1.0;
// Minimum clip duration for the timeline, prevents the clip from autoadjusting to non valid values when loading a partially edited clip with just the start point
export const DefaultMinimumClipDuration = 0.1;
// Tolerance used during the pen tool to determine wether to move a point instead of creating a new one
export const PenToolMovePointTolerance = 8;
// Time step value when using the stepper in the trim tool
export const TrimTimeEditingStep = 0.1;

/* File Upload */
export const MimeTypes = {
  'audio/wav': ['.wav'],
  'audio/mpeg': ['.mp3'],
  'audio/ogg': ['.ogg'],
  'audio/wave': ['.wav'],
  'audio/aiff': ['.aiff', '.aif'],
  'application/json': ['.haptic'],
};

// The length of the ducking area around a pasted emphasis breakpoint, in seconds. This is used
// in the "paste emphasis in place" action.
export const PasteEmphasisDuckingBeforeDuration = 0.03;
export const PasteEmphasisDuckingAfterDuration = 0.03;
// How quickly the continuous signal should change its amplitude to the amplitude of the pasted
// emphasis breakpoint, in seconds. This is used in the "paste emphasis in place" action.
export const PasteEmphasisDuckingChangeDuration = 0.001;

/* Local Storage Constants */
export const TermsAcceptedKey = 'terms-accepted';
export const ExportDefaultFormatOption = 'export-default-format-option';
export const ExportDefaultWaveFormatOption =
  'export-default-wave-format-option';
export const ExportDefaultActuatorOption = 'export-default-actuator-option';

/* App Lab */
export const AppLabUrl = 'https://www.meta.com/experiences/6759764157450104/';

/* Tutorial constants */
export const TutorialProgressKey = 'tutorial-progress';
export const TutorialLastOpenedKey = 'tutorial-last-opened';
export const TutorialPageSeparator = '/newpage';
export const TutorialPrefix = '[tutorial]';
export const TutorialDefaultProject = 'basics-of-haptic-design';

/* External Resource */
export const DocumentationUrl =
  'https://developer.oculus.com/resources/haptics-studio/';
