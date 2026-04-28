/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Sample implementation of the Telemetry service for Haptics Studio
 * Relevant methods are stubbed out, implementation is optional
 */

import {AxiosResponse} from 'axios';
import Logger from './common/logger';

const singletonEnforcer = Symbol('singletonEnforcer');

export const AnalyticsConstants = {
  ENDPOINT: '',
  INTERVAL: 3000,
};

// Define some example events to track errors
export enum EventType {
  error = 'error',
  essential = 'essential',
  nonEssential = 'nonEssential',
}

export enum ActivityEssential {
  someEvent = 'some_event',
}

export enum ActivityNonEssential {
  someEvent = 'some_event',
}

export enum ErrorType {
  crash = 'crash',
  frontend = 'frontend',
  hapticsSdk = 'haptics_sdk',
  backend = 'backend',
}

export interface AnalyticsMessage {
  session_guid: string;
}

type ErrorMessage = {
  type: ErrorType;
  error_name: string;
  message?: string;
  stack_trace: string;
  timestamp?: number;
};

export interface TelemetryConsentState {
  shouldShowTelemetryConsentWindow: boolean;
  shouldShowTelemetryNotification: boolean;
  consentTitle: string;
  consentMarkdownText: string;
  consentNotificationMarkdownText: string;
  settingsChangeText: string;
  isConsentSettingsChangeEnabled: boolean;
  hasConsent: boolean;
}

export interface AnalyticsMessageParameters {}

export default class Analytics {
  private static singleton: Analytics;

  private eventsInterval!: ReturnType<typeof setInterval>;

  private consentState: TelemetryConsentState | undefined;

  constructor(enforcer: symbol) {
    if (enforcer !== singletonEnforcer) {
      throw new Error('Cannot construct singleton');
    }
  }

  static get instance(): Analytics {
    if (!Analytics.singleton) {
      Analytics.singleton = new Analytics(singletonEnforcer);
    }
    return Analytics.singleton;
  }

  /**
   * Init the analytics service
   */
  public start(): void {
    this.refreshConsentState();
    clearInterval(this.eventsInterval);
    this.eventsInterval = setInterval(() => {
      void this.flushMessages();
      this.refreshConsentState();
    }, AnalyticsConstants.INTERVAL);
  }

  /**
   * Stops the analytics service
   */
  public stop(): Promise<AxiosResponse | void> {
    clearInterval(this.eventsInterval);
    return this.flushMessages();
  }

  /**
   * Queue an essential event to be logged on the next flush
   * @param activity the activity type
   * @param message the payload
   */
  public addEssentialEvent(activity: ActivityEssential, message?: any): void {
    this.addEvent(EventType.essential, activity, message);
  }

  /**
   * Queue an error event to be logged on the next flush
   * @param message the payload
   */
  public addErrorEvent(message?: ErrorMessage): void {
    Logger.silly('Analytics.addErrorEvent:', message);
  }

  public refreshConsentState(): void {
    this.consentState = {
      shouldShowTelemetryConsentWindow: false,
      shouldShowTelemetryNotification: false,
      consentTitle: '',
      consentMarkdownText: '',
      consentNotificationMarkdownText: '',
      settingsChangeText: '',
      isConsentSettingsChangeEnabled: false,
      hasConsent: true,
    };
  }

  public getConsentState(): TelemetryConsentState {
    if (process.env.NODE_ENV === 'test') {
      return {
        shouldShowTelemetryConsentWindow: false,
        shouldShowTelemetryNotification: false,
        consentTitle: '',
        consentMarkdownText: '',
        consentNotificationMarkdownText: '',
        settingsChangeText: '',
        isConsentSettingsChangeEnabled: false,
        hasConsent: true,
      };
    }
    if (!this.consentState) {
      this.refreshConsentState();
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.consentState!;
  }

  private addEvent(
    type: EventType,
    activity: ActivityEssential | ActivityNonEssential,
    message?: Partial<any>,
  ): void {
    Logger.silly(`Analytics.addEvent: ${type}:${activity}`, message);
  }

  private flushMessages = async (): Promise<AxiosResponse | void> => {
    Logger.silly('Analytics.flushMessages');
  };
}
