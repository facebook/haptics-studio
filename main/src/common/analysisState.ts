/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

let runningAnalyses = 0;

export function beginAnalysis(): void {
  runningAnalyses += 1;
}

export function endAnalysis(): void {
  runningAnalyses = Math.max(0, runningAnalyses - 1);
}

export function isAnalysisInProgress(): boolean {
  return runningAnalyses > 0;
}
