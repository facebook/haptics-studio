/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Regression guardrail for unsanitized HTML sinks.
 *
 * A crafted `.hasp` file could drive unsanitized markdown -> HTML -> React
 * `dangerouslySetInnerHTML`, producing a stored XSS. All tutorial/markdown
 * content is routed through `markdownToSafeHtml` / `sanitizeHtml`
 * (see utils/sanitizeHtml.ts).
 *
 * This test statically scans the frontend source tree and fails if any
 * `dangerouslySetInnerHTML` sink feeds HTML that is not produced by
 * `sanitizeHtml` / `markdownToSafeHtml`, so a future edit cannot reintroduce an
 * unsanitized sink without a reviewer explicitly updating the allowlist below.
 */

import * as fs from 'fs';
import * as path from 'path';

// frontend/src root, resolved relative to this file (utils/) so it works
// regardless of the jest cwd.
const FRONTEND_SRC = path.resolve(__dirname, '..');

const SANITIZER_CALL = /(sanitizeHtml|markdownToSafeHtml)\s*\(/;
const SANITIZER_IMPORT = /from\s+['"][^'"]*sanitizeHtml['"]/;
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/**
 * Sinks that are known-safe despite not routing through the sanitizer.
 * Each entry pins the exact `__html` expression so a NEW dynamic sink added to
 * the same file is still caught.
 */
const ALLOWLIST: Array<{file: string; htmlExpr: string; reason: string}> = [
  {
    // Static, developer-authored i18n string (no user/document input), so
    // there is nothing to sanitize. It uses dangerouslySetInnerHTML only to
    // render inline markup baked into the localized string.
    file: 'components/bugreport/BugReportDialog.tsx',
    htmlExpr: "lang('bugreport.subtitle')",
    reason: 'static lang() i18n string, no untrusted input',
  },
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__mocks__') {
        continue;
      }
      out.push(...walk(full));
    } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.(test|spec)\./.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Given source text and the index just after `{{`, return the `__html`
 * expression by reading the balanced object literal, then extracting the value
 * assigned to `__html`.
 */
function extractHtmlExpr(source: string, openIdx: number): string | null {
  let depth = 1;
  let i = openIdx;
  while (i < source.length && depth > 0) {
    const ch = source[i];
    if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
    }
    i++;
  }
  const objBody = source.slice(openIdx, i - 1);
  const m = objBody.match(/__html\s*:\s*([\s\S]*)/);
  if (!m) {
    return null;
  }
  // Trim a trailing comma and collapse whitespace to a single line for matching.
  return m[1].replace(/,\s*$/, '').replace(/\s+/g, ' ').trim();
}

function findSinks(source: string): string[] {
  const exprs: string[] = [];
  const marker = 'dangerouslySetInnerHTML';
  let from = 0;
  for (;;) {
    const idx = source.indexOf(marker, from);
    if (idx === -1) {
      break;
    }
    from = idx + marker.length;
    const openBraces = source.indexOf('{{', idx);
    if (openBraces === -1) {
      continue;
    }
    const expr = extractHtmlExpr(source, openBraces + 2);
    if (expr != null) {
      exprs.push(expr);
    }
  }
  return exprs;
}

/**
 * An `__html` expression is sanitized if it directly calls the sanitizer, or if
 * it is a bare identifier bound to a sanitizer call elsewhere in the same file
 * (e.g. `const bodyHtml = React.useMemo(() => markdownToSafeHtml(...))`).
 */
function isSanitized(expr: string, source: string): boolean {
  if (SANITIZER_CALL.test(expr)) {
    return true;
  }
  if (IDENTIFIER.test(expr)) {
    const binding = new RegExp(
      `(?:const|let|var)\\s+${expr}\\b[\\s\\S]{0,300}?(?:sanitizeHtml|markdownToSafeHtml)\\s*\\(`,
    );
    return binding.test(source);
  }
  return false;
}

describe('dangerouslySetInnerHTML sanitization guardrail', () => {
  const files = walk(FRONTEND_SRC);

  it('scans a non-trivial number of source files', () => {
    // Sanity check that the walk actually found the tree (guards against a
    // silently-empty scan that would make the test vacuously pass).
    expect(files.length).toBeGreaterThan(20);
  });

  it('routes every dangerouslySetInnerHTML through sanitizeHtml/markdownToSafeHtml', () => {
    const violations: string[] = [];

    for (const file of files) {
      const source = fs.readFileSync(file, 'utf-8');
      const sinks = findSinks(source);
      if (sinks.length === 0) {
        continue;
      }
      const rel = path.relative(FRONTEND_SRC, file);
      const importsSanitizer = SANITIZER_IMPORT.test(source);

      for (const expr of sinks) {
        const allow = ALLOWLIST.find(
          (a) => a.file === rel && a.htmlExpr === expr,
        );
        if (allow) {
          continue;
        }
        if (isSanitized(expr, source) && importsSanitizer) {
          continue;
        }
        violations.push(`${rel}: dangerouslySetInnerHTML __html={${expr}}`);
      }
    }

    expect(violations).toEqual([]);
  });
});
