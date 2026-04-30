/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export function timeFormat(time: number, markers?: boolean): string {
  const totalMillis = Math.round(time * 1000);
  const millis = (totalMillis % 1000).toString().padStart(3, '0');
  const totalSeconds = Math.floor(totalMillis / 1000);
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  const minutes = Math.floor(totalSeconds / 60);

  if (markers || time >= 60) {
    return `${minutes}:${seconds}.${millis}`;
  }
  return `${seconds}.${millis}`;
}

/**
 * Convert a string in the time format MM:SS:mmm to a float value
 * @param time the input string in MM:SS:mmm format
 * @returns the time in floating representation
 */
export function timeFromString(time: string): number {
  if (/^\d+$/.test(time)) return parseInt(time, 10);

  const components = time.split(/[,.:]/g).reverse();

  let t = 0;
  // ms
  if (components.length > 0) {
    t = parseFloat(`0.${components[0]}`) || 0;
  }
  // s
  if (components.length > 1) {
    t += parseInt(components[1], 10) || 0;
  }
  // m
  if (components.length > 2) {
    t += (parseInt(components[2], 10) || 0) * 60;
  }
  return t;
}
