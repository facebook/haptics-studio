/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {EmphasisType} from '../../state/types';
import {
  EmphasisMediumValue,
  EmphasisRoundValue,
  EmphasisSharpValue,
} from '../constants';

/**
 * Get the default frequency value for a given emphasis type
 * @param value the emphasis type
 * @returns a value between 0 and 1
 */
export function frequencyForSharpness(value: EmphasisType): number {
  switch (value) {
    case EmphasisType.Sharp:
      return EmphasisSharpValue;
    case EmphasisType.Medium:
      return EmphasisMediumValue;
    case EmphasisType.Round:
      return EmphasisRoundValue;
    default:
      return 0;
  }
}

/**
 * Get the emphasis type from a frequency value. The value is determined by how 'close' it is to the threshold
 * @param value the frequency value
 * @returns an emphasis type
 */
export function emphasisTypeFrom(value: number): EmphasisType {
  return [
    {type: EmphasisType.Sharp, threshold: Math.abs(EmphasisSharpValue - value)},
    {
      type: EmphasisType.Medium,
      threshold: Math.abs(EmphasisMediumValue - value),
    },
    {type: EmphasisType.Round, threshold: Math.abs(EmphasisRoundValue - value)},
  ].sort((a, b) => a.threshold - b.threshold)[0].type;
}
