/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  ClipboardContent,
  isContentValid,
  validateJsonString,
  getAmplitudeAndTimingArrays,
} from '../src/hapticsSdk';
import mockedDatamodel from '../test/mocks/datamodel';
import {generateRandomClip} from './mocks/project';

describe('Haptics SDK', () => {
  describe('isContentValid', () => {
    describe('if the content is not an object', () => {
      it('should not be valid', () => {
        const content = 'my string' as any as ClipboardContent;
        expect(isContentValid(content)).toBeFalsy();
      });
    });
    describe('if the content is an object without the amplitute and frequency properties', () => {
      it('should not be valid', () => {
        const content = {} as any as ClipboardContent;
        expect(isContentValid(content)).toBeFalsy();
      });
      it('should not be valid', () => {
        const content = {
          amplitude: [{time: 1, amplitude: 2}],
        } as any as ClipboardContent;
        expect(isContentValid(content)).toBeFalsy();
      });
      it('should not be valid', () => {
        const content = {
          frequency: [{time: 1, frequency: 2}],
        } as any as ClipboardContent;
        expect(isContentValid(content)).toBeFalsy();
      });
    });
    describe('if the content is an object with wrong amplitute or frequency properties', () => {
      it('should not be valid', () => {
        const content = {
          amplitude: [{time: 1, amplitude: 2}],
          frequency: 'test',
        } as any as ClipboardContent;
        expect(isContentValid(content)).toBeFalsy();
      });
      it('should not be valid', () => {
        const content = {
          frequency: [{time: 1, frequency: 2}],
          amplitude: 'test',
        } as any as ClipboardContent;
        expect(isContentValid(content)).toBeFalsy();
      });
    });
    describe('if the content is an object with the amplitute and frequency properties', () => {
      it('should be valid', () => {
        const content = {
          amplitude: [{time: 1, amplitude: 2}],
          frequency: [{time: 1, frequency: 2}],
        };
        expect(isContentValid(content)).toBeTruthy();
      });
    });
  });

  describe('getAmplitudeAndTimingArrays', () => {
    const clipMock = generateRandomClip({});

    it('should return the amplitude and timing arrays', () => {
      const {amplitudes, timings} = getAmplitudeAndTimingArrays(
        clipMock.haptic!,
      );
      expect(Array.isArray(amplitudes)).toBe(true);
      expect(amplitudes.length).toBeGreaterThan(0);
      expect(Array.isArray(timings)).toBe(true);
      expect(timings.length).toBeGreaterThan(0);
    });
  });

  describe('validateJsonString', () => {
    expect(validateJsonString('')).toBeFalsy();
    expect(validateJsonString('{}')).toBeFalsy();
    expect(validateJsonString(JSON.stringify(mockedDatamodel))).toBeTruthy();
  });
});
