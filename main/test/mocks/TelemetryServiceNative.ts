/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

export const getOrCreateMachineId = (): string =>
  '00112233-4455-6677-8899-AABBCCDDEEFF';
export const saveConsent = (consent: boolean): void => {};
export const shouldShowTelemetryConsentWindow = (): boolean => true;
export const shouldShowTelemetryNotification = (): boolean => true;
export const setNotificationShown = (): void => {};
export const getConsentTitle = (): string => 'Consent Title';
export const getConsentMarkdownText = (): string => 'Consent Text';
export const getConsentNotificationMarkdownText = (markdown: string): string =>
  `Consent Notification Text: ${markdown}`;
export const getSettingsChangeText = (): string => 'Settings Change Text';
export const isConsentSettingsChangeEnabled = (): boolean => true;
export const hasConsent = (): boolean => false;
