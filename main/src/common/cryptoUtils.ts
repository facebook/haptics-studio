/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import crypto from 'crypto';

export interface PKCEPair {
  verifier: string;
  challenge: string;
}

function urlEncodeBase64String(str: string) {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64hash(str: string) {
  return crypto.createHash('sha256').update(str).digest().toString('base64');
}

function base64random(bytes: number) {
  return crypto.randomBytes(bytes).toString('base64');
}

export function getPKCEChallengePair(): PKCEPair {
  const seed = base64random(32);
  const verifier = urlEncodeBase64String(seed);
  const challenge = urlEncodeBase64String(base64hash(verifier));
  return {verifier, challenge};
}
