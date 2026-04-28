/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';
import fs from 'fs';
import * as mm from 'music-metadata';
import * as ffmpeg from '@ffmpeg/ffmpeg';
import {Envelopes, FrequencyBreakpoint, HapticData} from '../../src/hapticsSdk';

import * as utils from '../../src/common/utils';

import Constants from '../../src/common/constants';
import mockedHapticData from '../mocks/datamodel';
import FFmpegHelper from '../../src/ffmpeg';
import Configs, {AppVersion} from '../../src/common/configs';
// @oss-disable

const mocksPath = path.join(path.resolve(__dirname), '..', 'samples');

const mockFFmpeg: ffmpeg.FFmpeg = {
  load() {
    return Promise.resolve();
  },
  isLoaded() {
    return true;
  },
  run() {
    return Promise.resolve();
  },
  FS<Method extends ffmpeg.FSMethodNames>(): ffmpeg.FSMethodReturn[Method] {
    return new Uint8Array() as ffmpeg.FSMethodReturn[Method];
  },
  setProgress(): void {},
  setLogger(): void {},
  setLogging(): void {},
  exit(): void {},
};

describe('utils', () => {
  describe('trimmedHapticData', () => {
    it('should return a valid HapticData object with the envelopes trimmed at the given time', () => {
      const trimmed = utils.trimmedHapticData(mockedHapticData, 0.75);
      const {amplitude, frequency = []} = trimmed.signals.continuous.envelopes;
      expect(amplitude[amplitude.length - 1].time).toBeCloseTo(0.75);
      expect(amplitude[amplitude.length - 1].amplitude).toBeCloseTo(0.3);
      expect(amplitude[frequency.length - 1].time).toBeCloseTo(0.75);
      expect(frequency[frequency.length - 1].frequency).toBeCloseTo(0.5);
    });
  });

  describe('getSplitChannels', () => {
    beforeEach(() => {
      jest
        .spyOn(FFmpegHelper.instance, 'getFFmpeg')
        .mockImplementation(() => Promise.resolve(mockFFmpeg));
      jest.spyOn(fs, 'writeFileSync').mockImplementation();
      jest.spyOn(mockFFmpeg, 'run').mockImplementation();
      // @oss-disable
    });

    it('should return the paths to the left and right channels', async () => {
      const mocksPath = path.join(path.resolve(__dirname), '..', 'samples');
      const channels = await utils.getSplitChannels(
        path.join(mocksPath, 'audio.wav'),
      );
      expect(channels.left).toEqual(path.join(mocksPath, 'audio_L.wav'));
      expect(channels.right).toEqual(path.join(mocksPath, 'audio_R.wav'));
    });

    it('should write the new files', async () => {
      const mocksPath = path.join(path.resolve(__dirname), '..', 'samples');
      const channels = await utils.getSplitChannels(
        path.join(mocksPath, 'audio.wav'),
      );
      expect(jest.spyOn(fs, 'writeFileSync')).toHaveBeenNthCalledWith(
        1,
        channels.left,
        expect.anything(),
      );
      expect(jest.spyOn(fs, 'writeFileSync')).toHaveBeenNthCalledWith(
        2,
        channels.right,
        expect.anything(),
      );
    });
  });

  describe('sanitizedEnvelopes', () => {
    it('should add a point to the frequency if the envelope ends before the amplitude', () => {
      const data = utils.sanitizedEnvelopes({
        signals: {
          continuous: {
            envelopes: {
              amplitude: [
                {time: 0.0, amplitude: 0.0},
                {time: 0.1, amplitude: 0.1},
                {time: 0.2, amplitude: 0.2},
                {time: 0.3, amplitude: 0.3},
                {time: 0.4, amplitude: 0.4},
              ],
              frequency: [
                {time: 0.0, frequency: 0.0},
                {time: 0.1, frequency: 0.1},
                {time: 0.2, frequency: 0.2},
                {time: 0.3, frequency: 0.3},
              ],
            },
          },
        },
      } as HapticData);
      expect(data).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const {frequency = []} = data!.signals.continuous.envelopes;
      expect(frequency[frequency.length - 1].time).toBeCloseTo(0.4);
      expect(frequency[frequency.length - 1].frequency).toBeCloseTo(0.3);
    });

    it('should add a point to the amplitude if the envelope ends before the frequency', () => {
      const data = utils.sanitizedEnvelopes({
        signals: {
          continuous: {
            envelopes: {
              amplitude: [
                {time: 0.0, amplitude: 0.0},
                {time: 0.1, amplitude: 0.1},
                {time: 0.2, amplitude: 0.2},
                {time: 0.3, amplitude: 0.3},
              ],
              frequency: [
                {time: 0.0, frequency: 0.0},
                {time: 0.1, frequency: 0.1},
                {time: 0.2, frequency: 0.2},
                {time: 0.3, frequency: 0.3},
                {time: 0.4, frequency: 0.4},
              ],
            },
          },
        },
      } as HapticData);
      expect(data).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const {amplitude} = data!.signals.continuous.envelopes;
      expect(amplitude[amplitude.length - 1].time).toBeCloseTo(0.4);
      expect(amplitude[amplitude.length - 1].amplitude).toBeCloseTo(0.3);
    });

    it('should complete a partial envelope (only the starting point)', () => {
      const data = utils.sanitizedEnvelopes({
        signals: {
          continuous: {
            envelopes: {
              amplitude: [
                {time: 0.0, amplitude: 0.0},
                {time: 0.1, amplitude: 0.1},
                {time: 0.2, amplitude: 0.2},
                {time: 0.3, amplitude: 0.3},
                {time: 0.4, amplitude: 0.4},
              ],
              frequency: [{time: 0.0, frequency: 0.5}],
            },
          },
        },
      } as HapticData);
      expect(data).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const {frequency = []} = data!.signals.continuous.envelopes;
      expect(frequency[frequency.length - 1].time).toBe(0.4);
      expect(frequency[frequency.length - 1].frequency).toBe(0.5);
    });

    it('should not add points if the two envelopes are the same length', () => {
      const data = utils.sanitizedEnvelopes({
        signals: {
          continuous: {
            envelopes: {
              amplitude: [
                {time: 0.0, amplitude: 0.0},
                {time: 0.1, amplitude: 0.1},
                {time: 0.4, amplitude: 0.2},
              ],
              frequency: [
                {time: 0.0, frequency: 0.0},
                {time: 0.1, frequency: 0.1},
                {time: 0.2, frequency: 0.2},
                {time: 0.3, frequency: 0.3},
                {time: 0.4, frequency: 0.4},
              ],
            },
          },
        },
      } as HapticData);
      expect(data).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const {amplitude, frequency = []} = data!.signals.continuous.envelopes;
      expect(amplitude.length).toBe(3);
      expect(frequency.length).toBe(5);
    });

    it('should return undefined if one of the envelopes is empty or both have only one point', () => {
      let data = utils.sanitizedEnvelopes({
        signals: {
          continuous: {
            envelopes: {
              amplitude: [
                {time: 0.0, amplitude: 0.0},
                {time: 0.1, amplitude: 0.1},
              ],
              frequency: [] as FrequencyBreakpoint[],
            },
          },
        },
      } as HapticData);
      expect(data).toBeUndefined();

      data = utils.sanitizedEnvelopes({
        signals: {
          continuous: {
            envelopes: {
              amplitude: [{time: 0.0, amplitude: 0.0}],
              frequency: [{time: 0.0, frequency: 0.0}],
            },
          },
        },
      } as HapticData);
      expect(data).toBeUndefined();
    });
  });

  describe('verifyAudioFile', () => {
    it('should return the audio file metadata', async () => {
      const audioFile = path.join(mocksPath, 'audio.wav');
      const {duration, channels} = await utils.verifyAudioFile(audioFile);
      expect(duration).toBeCloseTo(4.0, 0.01);
      expect(channels).toBe(2);
    });

    it('should raise an error if the file is too long', () => {
      const {MAX_AUDIO_DURATION} = Constants;
      jest.spyOn(mm, 'parseFile').mockReturnValue(
        Promise.resolve({
          format: {
            duration: MAX_AUDIO_DURATION * 2,
          },
        } as mm.IAudioMetadata),
      );
      void expect(
        utils.verifyAudioFile(path.join(mocksPath, 'audio.wav')),
      ).rejects.toThrow();
    });
  });

  describe('semVerFromObject', () => {
    it('should return a new SemVer object', () => {
      const version: AppVersion = {
        major: 1,
        minor: 2,
        patch: 3,
      };
      expect(utils.semVerFromObject(version).version).toBe('1.2.3');
    });
  });

  describe('createEmptyHaptic', () => {
    it('should set the haptic version to the Haptics SDK format version', () => {
      expect(utils.createEmptyHaptic().version).toBe(
        Constants.HAPTICS_SDK.FORMAT_VERSION,
      );
    });
  });

  describe('getReleaseChannel', () => {
    it('should return the correct release channel', () => {
      Configs.instance.load();
      Configs.configs.app.version = '2.0.0-beta';
      expect(utils.getReleaseChannel()).toBe('beta');

      Configs.configs.app.version = '2.0.0-beta.1';
      expect(utils.getReleaseChannel()).toBe('beta');

      Configs.configs.app.version = '2.0.0';
      expect(utils.getReleaseChannel()).toBe('latest');
    });
  });

  describe('sanitizeEnvelopesDuration', () => {
    it('should update the last time point with the highest time value between amplitude and frequency', () => {
      const envelopes: Envelopes = {
        amplitude: [
          {time: 0, amplitude: 0},
          {time: 1, amplitude: 0},
          {time: 2, amplitude: 0},
        ],
        frequency: [
          {time: 0, frequency: 0},
          {time: 1, frequency: 0},
          {time: 2.5, frequency: 0},
        ],
      };
      utils.sanitizeEnvelopesDuration(envelopes);
      expect(envelopes.amplitude[2].time).toEqual(2.5);
    });
  });
});
