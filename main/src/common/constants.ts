/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default {
  SHOULD_RESTART_ON_EXCEPTION: false,
  MAX_RECENT_PROJECTS: 10,
  MAX_UPLOAD_SIZE: process.env.NODE_ENV === 'test' ? 10485760 : 209715200,
  API_TIMEOUT: 600000,
  MAX_AUDIO_DURATION: 600,
  DEFAULT_PROJECT_NAME: 'My Project',
  MIN_WINDOW_SIZE: {WIDTH: 1440, HEIGHT: 840},
  WEB_SERVER: {
    PORTS: [9999, 19999, 29999, 39999, 49999],
  },
  ENABLE_RELOAD_AUDIO_ON_ANALYSIS: false,
  UDP: {
    ADVERTISING_PORT: 9998,
    ADVERTISING_TIMEOUT: 1000,
    BROADCAST_ADDRESS: '255.255.255.255',
  },
  WS: {
    PORT: 9999,
    PATH: '/ws',
    PROTOCOL: 'ws',
    AUTH_CODE_VALIDITY: 300000, // 5 minutes
    REQUIRE_PAIRING_CODE: true,
    MAX_HTTP_BUFFER_SIZE: 10485760, // 10MB
  },
  EXPORT: {
    SUFFIX: '_haptic',
  },
  PROJECT: {
    EXTENSION: '.hasp',
    SUPPORTED_EXTENSIONS: ['.hasp', '.lofelt'],
    SUPPORTED_AUDIO_EXTENSIONS: [
      '.mp3',
      '.ogg',
      '.pcm',
      '.vorbis',
      '.wav',
      '.aiff',
      '.aif',
    ],
    TUTORIAL_ASSETS_FOLDER: 'assets',
    TUTORIAL_PREFIX: '[tutorial]',
    SAMPLES_METADATA_FILENAME: 'metadata.json',
  },
  HAPTICS_SDK: {
    FORMAT_VERSION: {major: 1, minor: 0, patch: 0},
  },
  AUTO_UPDATER: {
    // @oss-disable
    FEED_URL: '', // @oss-enable
  },
  MENU: {
    HELP: [
      {
        label: 'Documentation',
        url: 'https://developers.meta.com/horizon/resources/haptics-studio/',
      },
      {
        label: 'Haptics SDK for Unity',
        url: 'https://developers.meta.com/horizon/documentation/unity/unity-haptics-sdk/',
      },
      {
        label: 'Haptics SDK for Unreal',
        url: 'https://developers.meta.com/horizon/documentation/unreal/unreal-haptics-sdk/',
      },
    ],
  },
};
