/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {IpcInvokeChannel} from '../../../shared';
import {createIPCHandler} from './ipcHandlerUtils';
import Analytics, {
  ActivityEssential,
  AnalyticsMessageParameters,
  ErrorType,
  TelemetryConsentState,
} from '../analytics';

export interface FrontendAnalyticsMessage {
  activity: ActivityEssential;
  message: Partial<AnalyticsMessageParameters>;
}

export interface FrontendErrorMessage {
  name: string;
  message: string;
  stack?: string;
}

function getConsentState() {
  createIPCHandler<void, TelemetryConsentState>(
    IpcInvokeChannel.TelemetryConsentState,
    () => ({
      payload: Analytics.instance.getConsentState(),
    }),
  );
}

function frontendAnalyticsMessage() {
  createIPCHandler<FrontendAnalyticsMessage>(
    IpcInvokeChannel.FrontendAnalyticsMessage,
    args => {
      Analytics.instance.addEssentialEvent(args.activity, args.message);
      return {status: 'ok'};
    },
  );
}

function frontendErrorRaised() {
  createIPCHandler<FrontendErrorMessage>(
    IpcInvokeChannel.FrontendErrorRaised,
    args => {
      Analytics.instance.addErrorEvent({
        type: ErrorType.frontend,
        error_name: args.name,
        message: args.message,
        stack_trace: args.stack ?? '',
      });
      return {status: 'ok'};
    },
  );
}

function saveConsent() {
  createIPCHandler<{consent: boolean}, TelemetryConsentState>(
    IpcInvokeChannel.TelemetrySaveConsentState,
    args => {
      // @oss-disable
      Analytics.instance.refreshConsentState();
      return {payload: Analytics.instance.getConsentState()};
    },
  );
}

function setConsentNotificationShown() {
  createIPCHandler<void, TelemetryConsentState>(
    IpcInvokeChannel.TelemetrySetConsentNotificationShown,
    () => {
      // @oss-disable
      Analytics.instance.refreshConsentState();
      return {payload: Analytics.instance.getConsentState()};
    },
  );
}

/**
 * Bind IPC messages
 */
export default function (): void {
  getConsentState();
  frontendAnalyticsMessage();
  frontendErrorRaised();
  saveConsent();
  setConsentNotificationShown();
}
