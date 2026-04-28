/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable camelcase */
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import urljoin from 'url-join';

import {AnalyticsConstants} from '../../src/analytics';

const mock = new MockAdapter(axios);
const API_BASE = 'http://test.mock';

export function apiCalls(method: string, api: string): number {
  const url = urljoin(API_BASE, api);
  const calls = mock.history[method].filter(call => call.url === url);
  return calls.length;
}

export function resetMocks(): void {
  mock.reset();
}

export function mockInternalServerError(): void {
  const regExp = new RegExp(`${API_BASE}/*`);
  mock.onAny(regExp).reply(500);
}

export function mockBadResponse(): void {
  const regExp = new RegExp(`${API_BASE}/*`);
  mock.onAny(regExp).reply(400);
}

// Mock analyts endpoint
export function mockAnalytics(): void {
  mock.onPost(AnalyticsConstants.ENDPOINT).reply(200, {});
}
