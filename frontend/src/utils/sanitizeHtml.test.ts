/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {markdownToSafeHtml, sanitizeHtml} from './sanitizeHtml';

describe('sanitizeHtml', () => {
  describe('sanitizeHtml', () => {
    it('strips script tags', () => {
      const result = sanitizeHtml('<p>hi</p><script>alert(1)</script>');
      expect(result).toBe('<p>hi</p>');
    });

    it('strips javascript: URIs from anchors', () => {
      const result = sanitizeHtml('<a href="javascript:alert(1)">x</a>');
      expect(result).not.toContain('javascript:');
    });

    it.each([
      ['onerror', '<img src="media://a.png" onerror="alert(1)" />'],
      ['onload', '<img src="media://a.png" onload="alert(1)" />'],
      ['onclick', '<a href="https://example.com" onclick="alert(1)">x</a>'],
      ['onfocus', '<a href="https://example.com" onfocus="alert(1)">x</a>'],
      [
        'onmouseover',
        '<a href="https://example.com" onmouseover="alert(1)">x</a>',
      ],
      ['onkeydown', '<a href="https://example.com" onkeydown="alert(1)">x</a>'],
      ['onsubmit', '<form onsubmit="alert(1)"><input /></form>'],
    ])('strips %s event handler', (attr, html) => {
      const result = sanitizeHtml(html);
      expect(result.toLowerCase()).not.toMatch(new RegExp(`\\s${attr}\\s*=`));
    });

    it.each([
      ['javascript:', '<a href="javascript:alert(1)">x</a>'],
      ['JaVaScRiPt:', '<a href="JaVaScRiPt:alert(1)">x</a>'],
      ['vbscript:', '<a href="vbscript:msgbox(1)">x</a>'],
      [
        'data:text/html',
        '<a href="data:text/html,%3Cscript%3Ealert(1)%3C/script%3E">x</a>',
      ],
    ])('strips dangerous URI scheme: %s', (scheme, html) => {
      const result = sanitizeHtml(html);
      expect(result.toLowerCase()).not.toContain(scheme.toLowerCase());
    });

    it('preserves http(s) URLs on images', () => {
      const result = sanitizeHtml('<img src="https://example.com/a.png" />');
      expect(result).toContain('src="https://example.com/a.png"');
    });

    it('strips media:// URIs from anchors', () => {
      const result = sanitizeHtml('<a href="media://assets/evil.html">x</a>');
      expect(result).toBe('<a>x</a>');
    });

    it('preserves media:// URIs on images', () => {
      const result = sanitizeHtml('<img src="media://assets/intro.png" />');
      expect(result).toContain('src="media://assets/intro.png"');
    });

    it('preserves media:// URIs on videos', () => {
      const result = sanitizeHtml(
        '<video src="media://assets/clip.mp4" autoplay loop />',
      );
      expect(result).toContain('src="media://assets/clip.mp4"');
    });

    it('preserves media:// URIs on audio elements', () => {
      const result = sanitizeHtml('<audio src="media://assets/clip.wav" />');
      expect(result).toContain('src="media://assets/clip.wav"');
    });

    it('strips media:// URIs from non-src attributes', () => {
      const result = sanitizeHtml(
        '<img src="https://example.com/a.png" formaction="media://evil.png" />',
      );
      expect(result).not.toContain('media://');
    });
  });

  describe('markdownToSafeHtml', () => {
    it('converts markdown and preserves inline media:// images', () => {
      const result = markdownToSafeHtml(
        'Hello\n\n<p align="center"><img width="100%" src="media://assets/intro.png" /></p>',
      );
      expect(result).toContain('<img');
      expect(result).toContain('src="media://assets/intro.png"');
    });

    it('preserves inline media:// videos', () => {
      const result = markdownToSafeHtml(
        '<video width="100%" src="media://assets/breakpointediting.mp4" autoplay loop/>',
      );
      expect(result).toContain('src="media://assets/breakpointediting.mp4"');
    });

    it('strips script tags from markdown-embedded HTML', () => {
      const result = markdownToSafeHtml('text\n\n<script>alert(1)</script>');
      expect(result).not.toContain('<script');
    });

    it('strips javascript: URIs in markdown links', () => {
      const result = markdownToSafeHtml('[click](javascript:alert(1))');
      expect(result).not.toContain('javascript:');
    });
  });
});
