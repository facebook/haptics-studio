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

    it('strips inline event handlers', () => {
      const result = sanitizeHtml('<img src="media://a.png" onerror="alert(1)" />');
      expect(result).not.toContain('onerror');
    });

    it('preserves http(s) URLs on images', () => {
      const result = sanitizeHtml('<img src="https://example.com/a.png" />');
      expect(result).toContain('src="https://example.com/a.png"');
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
