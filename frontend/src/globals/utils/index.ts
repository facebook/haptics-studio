/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export {
  screenToTime,
  timeToScreen,
  limitsFromTimeline,
  filteredDataFromBrush,
  polygonData,
  euclideanDistance,
  timeNormalizedEuclideanDistance,
  linearInterpolationForAxisValue,
  isSelectionRectValid,
  boundingBoxForSelection,
} from './coordinates';

export {
  plotHoverState,
  newEmphasisPointData,
  findAdjacentPoints,
  snapPointInData,
} from './plotInteraction';

export {frequencyForSharpness, emphasisTypeFrom} from './emphasis';

export {timeFormat, timeFromString} from './timeFormat';

export {douglasPeucker} from './dataProcessing';

export {
  envelopesFromSelection,
  createInterpolatedBreakpoint,
  filterClipboardForEmphasisPaste,
  pastedEnvelopes,
  pastedEmphasisEnvelope,
} from './clipboard';

export {editorDataFromHaptic, timelineFor, clipDuration} from './hapticData';

export {getUniqueName, duplicatedClipsAndGroups, analyzeFiles} from './project';

export {mediaPath} from './url';
