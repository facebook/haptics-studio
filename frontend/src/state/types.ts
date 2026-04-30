/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  HapticData,
  AmplitudeBreakpoint,
  FrequencyBreakpoint,
} from '../../../main/src/hapticsSdk';
import {AnyAction} from 'redux';

import {CustomFlags} from '../../../main/src/customFlags';

/* Shared types */

export type Maybe<T> = NonNullable<T> | undefined;

export enum TimelineCursorType {
  Left = 0,
  Right = 1,
  Center = 2,
  Outside = 3,
}

export const enum DeviceConnectionStatus {
  Active = 'active',
  Connecting = 'connecting',
  NotConnected = 'disconnected',
  Unknown = 'unknown',
}

export const enum DeviceSerialNumberIdentifier {
  QuestPro = '23',
  Quest2 = '1WMHH',
  Quest3 = '2G',
  Quest3S = '34',
}

export interface Device {
  status: DeviceConnectionStatus;
  deviceId: string;
  name: string;
  model: string;
  version: string;
}

export interface WindowInformation {
  title: string;
  size: number[];
  projectName: string;
  isCurrentProjectDirty: boolean;
  fullScreen: boolean;
  isOnWindows: boolean;
  version: string;
  flags: CustomFlags;
}

/**
 * DSP Parameters. Key-value collection where the key is the DSP parameter
 */
export interface ParameterValues {
  [name: string]: number | undefined;
}

/**
 * Data point representation. `x` and `y` are the space coordinates, `index` is the index in the data array
 */
export interface EditorPointData {
  x: number;
  y: number;
  index: number;
  emphasis?: EditorEmphasisData;
}

/**
 * Represents the points horizontally adjacent to the mouse.
 * `left` and `right` are the adjacent points on a line, `match` is the point itself if the mouse position matches
 */
export interface AdjacentPoints {
  left: EditorPointData | undefined;
  right: EditorPointData | undefined;
  match: EditorPointData | undefined;
}

/**
 * Emphasis point representation that can be attached to an IEditorPointData. `y` is the amplitude value coordinates, `type` is the type of emphasis
 */
export interface EditorEmphasisData {
  y: number;
  frequency: number;
}

/**
 * Generic point with a `time` coordinate, used to treat amplitude and frequency datasets
 */
export interface TimelinePoint {
  time: number;
  amplitude?: number;
  frequency?: number;
}

export interface EnvelopeBreakpoint {
  time: number;
  amplitude?: number;
  frequency?: number;
  emphasis?: {
    amplitude: number;
    frequency: number;
  };
}

/**
 * Type of envelopes
 */

export const enum EnvelopeType {
  Amplitude = 'amplitude',
  Frequency = 'frequency',
}

export const enum EmphasisType {
  Sharp = 'sharp',
  Medium = 'medium',
  Round = 'round',
}

export const enum FocusArea {
  Navigator = 'navigator',
  Plot = 'plot',
  RightPanel = 'rightPanel',
}

export const enum SnackbarType {
  Info = 'info',
  Error = 'error',
  Success = 'success',
  Important = 'important',
}

/**
 * Represents a point position on screen
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Represents a size with width and height
 */
export interface Size {
  w: number;
  h: number;
}

/**
 * Represents a rectangle on screen
 */
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Represent the multiselection rectangle as the starting coordinate p0 and the ending p1
 */
export interface SelectionRect {
  x0?: number;
  y0?: number;
  x1?: number;
  y1?: number;
}

export interface BoundingRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface PlotHoverState {
  adjacentPoints: AdjacentPoints;
  closestPoints: Set<number>;
  closestEmphasis?: number[];
  hoveredPointIndex?: number;
}

export interface RenderSize {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface RenderMetadata extends RenderSize {
  duration: number;
  startTime: number;
}

export interface AnalyzerMetaStep {
  name: string;
  values: {
    [key: string]: any;
  };
}

/**
 * A collection of analysis parameters
 */
export interface AnalysisSettings {
  [key: string]: AnalyzerParameter;
}

/**
 * Represents a single parameter exposed by the DSP that can be change when performing a new audio analysis
 */
export interface AnalyzerParameter {
  /* Toggle that hides a parameter when in production when set to `true` */
  debugOnly: boolean;
  /* The name of the parameter. Can be empty */
  title?: string;
  /* The data type, used to determine wether to use a checkbox or a slider */
  type: string;
  /* The minimum acceptable parameter value. Can be empty for boolean types */
  min?: number;
  /* The maximum acceptable parameter value. Can be empty for boolean types */
  max?: number;
  /* The increment/decrement step of a float or integer parameter. This applies to the UI slider component. Can be empty for boolean types */
  step?: number;
  /* The default parameter value */
  default?: number;
  /* Measure unit to display, eg. 'Hz' or 'ms'. Can be empty */
  measure?: string;
  /* Create a dependency to another parameter. If that parameter value is false, the dependent parameter will be disabled */
  dependsOn?: string;
  /* Steps for the meta slider. Each step controls a set of parameters. REquired for type 'meta' */
  steps?: AnalyzerMetaStep[];
  /* Override the min/max label shown in the slider */
  overrideLabel?: string;
  /* For ranges only, determines which parameter is the lower bound */
  minRef?: string;
  /* For ranges only, determines which parameter is the upper bound */
  maxRef?: string;
}

/**
 * The parameters will be displayed in groups, each group has a title header and a set of parameters
 */
export interface AnalyzerParameterGroup {
  /* The group identifier */
  type: string;
  /* Toggle that hides a whole group of parameters when in production when set to `true` */
  debugOnly: boolean;
  /* The group name */
  title: string;
  /* The items to display */
  items: string[];
  /* The theme color of this group */
  color: string;
}

/**
 * Envelope from the svg representation
 */
export interface AudioEnvelope {
  envelope: Array<AmplitudeBreakpoint>;
}

/**
 * The "recent projects" entry
 */
export interface RecentProject {
  projectFile: string;
  name: string;
  error?: string;
  openedAt?: number;
  updatedAt: number;
  clipsCount?: number;
}

/**
 * Tutorial Categories
 */

export const enum TutorialCategory {
  Beginner = 'beginner',
  Intermediate = 'intermediate',
  Advanced = 'advanced',
}

/**
 * Project metadata
 */
export interface ProjectMetadata {
  description?: string;
  slug?: string;
  category?: string;
  version?: string;
}

/**
 * A sample project
 */
export interface SampleProject extends ProjectMetadata {
  name: string;
  projectFile: string;
  icon?: string;
  clipsCount?: number;
  updatedAt?: number;
  new?: boolean;
}

export interface ClipboardContent {
  amplitude: AmplitudeBreakpoint[];
  frequency: FrequencyBreakpoint[];
}

/* API and Redux constants */

export interface ClipMarker {
  id: string;
  name: string;
  time: number;
}

export interface AnalysisRequest {
  [k: string]: {path: string};
}

export interface Clip {
  name: string;
  audio: Audio | undefined;
  svg: AudioEnvelope | undefined;
  markers: Array<ClipMarker>;
  notes?: string;
  state: ClipHistory;

  playhead: number;
  loading: boolean;
  failed: boolean;
  error: string | undefined;
  hasChanges: {
    [EnvelopeType.Amplitude]: boolean;
    [EnvelopeType.Frequency]: boolean;
  };
  timeline: TimeLineState | undefined;
  trimAt: number | undefined;
}

export interface ClipGroup {
  id: string;
  name: string | undefined;
  isFolder: boolean;
  clips: string[];
}

export interface ClipState {
  revision: number;
  dsp: ParameterValues;
  haptic: HapticData | undefined;
  selectedPoints: Array<number>;
  selectedEmphasis: number | undefined;
}

export interface Audio {
  path?: string;
  exists?: boolean;
  channels?: number;
  hapticPath?: string;
}

export interface TimeLineState {
  startTime: number;
  endTime: number;
  duration: number;
  samples: number;
}

export interface ClipHistory {
  past: Array<ClipState>;
  present: ClipState;
  future: Array<ClipState>;
}

export type SnackbarAction = 'upgrade' | string; // Add future actions here if needed

export interface SnackbarState {
  text: string | undefined;
  textKey: string | undefined;
  type: SnackbarType;
  autoDismiss: boolean;
  action: SnackbarAction | undefined;
}

export interface DialogState {
  visible: boolean;
  title: string;
  text: string;
  confirmButton: string;
  action: AnyAction | undefined;
}

export interface UpdateInfo {
  releaseDate: string;
  releaseNotes: string;
  version: string;
}

export interface UpdateState extends UpdateInfo {
  progress: number | null;
  downloaded: boolean;
  showDialog: boolean;
}

export interface EnvelopeVisibility {
  audio: boolean;
  envelope: EnvelopeType;
}

export interface EditorState {
  clips: {
    [id: string]: Clip;
  };
}

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface TutorialEditorState {
  showPreview: boolean;
  showSettings: boolean;
}

export const enum LandingPageSection {
  Projects = 'projects',
  Learning = 'learning',
  Samples = 'samples',
}

export interface MenuItems {
  add_marker?: boolean;
  export_all?: boolean;
  export?: boolean;
  duplicate_clips?: boolean;
  group?: boolean;
  ungroup?: boolean;
  select_all?: boolean;
}

export const enum RightPanelSection {
  Analysis = 'analysis',
  Design = 'design',
  Markers = 'markers',
  TutorialEditor = 'tutorial-editor',
}

export interface ExternalResource {
  category: string;
  title: string;
  description: string;
  image: string;
  url: string;
}
