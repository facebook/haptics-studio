/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import DOMPurify from 'dompurify';
import showdown from 'showdown';

const converter = new showdown.Converter();
converter.setOption('simpleLineBreaks', true);

/**
 * URI scheme allowlist for sanitized HTML.
 *
 * This mirrors DOMPurify's default safe-URI regex but also accepts the
 * custom `media://` scheme, which is registered by the Electron main
 * process to serve project-relative assets (images and videos) referenced
 * by tutorial content. See `main/src/services/ProtocolHandler.ts`.
 *
 * Any scheme not in this list (e.g. `javascript:`, `data:` for non-images)
 * will have its attribute stripped by DOMPurify, preventing XSS.
 */
const ALLOWED_URI_REGEXP =
  /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|media):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;

const SANITIZE_CONFIG: DOMPurify.Config = {
  ALLOWED_URI_REGEXP,
};

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, SANITIZE_CONFIG) as string;
}

export function markdownToSafeHtml(markdown: string): string {
  return DOMPurify.sanitize(
    converter.makeHtml(markdown),
    SANITIZE_CONFIG,
  ) as string;
}
