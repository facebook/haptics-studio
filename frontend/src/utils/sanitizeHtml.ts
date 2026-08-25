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
 * This mirrors DOMPurify's default safe-URI regex. The custom `media://`
 * scheme is permitted separately only for media elements' `src` attributes.
 *
 * Any scheme not in this list (e.g. `javascript:`, `data:` for non-images)
 * will have its attribute stripped by DOMPurify, preventing XSS.
 *
 * SECURITY: Do NOT add `javascript`, `data`, `vbscript`, or `media` to this
 * regex. The output of this sanitizer is fed directly into
 * `dangerouslySetInnerHTML` by callers; allowing those schemes broadly would
 * defeat the sanitizer's contract and enable XSS. Regression tests in
 * `sanitizeHtml.test.ts` lock this down.
 */
const ALLOWED_URI_REGEXP =
  /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;

const SANITIZE_CONFIG: DOMPurify.Config = {
  ALLOWED_URI_REGEXP,
};

const MEDIA_ELEMENTS = new Set(['audio', 'img', 'video']);

function sanitizeWithScopedMediaUrls(html: string): string {
  DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
    if (
      data.attrName === 'src' &&
      data.attrValue.toLowerCase().startsWith('media://') &&
      MEDIA_ELEMENTS.has(node.nodeName.toLowerCase())
    ) {
      data.forceKeepAttr = true;
    }
  });

  try {
    return DOMPurify.sanitize(html, SANITIZE_CONFIG) as string;
  } finally {
    DOMPurify.removeHook('uponSanitizeAttribute');
  }
}

export function sanitizeHtml(html: string): string {
  return sanitizeWithScopedMediaUrls(html);
}

export function markdownToSafeHtml(markdown: string): string {
  return sanitizeWithScopedMediaUrls(converter.makeHtml(markdown));
}
