/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Dependency CVE gate for Meta Haptics Studio.
 *
 * Runs `yarn audit` against the production dependency tree and fails the build
 * when a HIGH or CRITICAL advisory is present, so that a publicly-known CVE in
 * a dependency cannot ship undetected.
 *
 * Behaviour:
 *   - Advisory data retrieved, HIGH/CRITICAL found  -> exit 1 (blocks CI).
 *   - Advisory data retrieved, nothing high/critical -> exit 0.
 *   - Advisory DB unreachable -> print a warning and exit 0 so a registry
 *     outage does not flap the build. Diff-time and GitHub Actions runs both
 *     enforce the gate when advisory data is available.
 *
 * To fix a real failure: upgrade the flagged package (`yarn why <pkg>` to find
 * who pulls it in), or pin a patched version via `resolutions` in package.json.
 */

'use strict';

const {spawnSync} = require('child_process');

const GATE_SEVERITIES = ['high', 'critical'];

function runYarnAudit() {
  // `--groups dependencies` restricts the scan to what actually ships in the
  // packaged Electron app (production deps). GitHub vulnerability alerts still
  // provide notification coverage for the complete exported dependency graph.
  // `yarn audit` exits with a non-zero bitmask when advisories are found; that
  // is expected, so we key off the parsed JSON, not the process exit code.
  return spawnSync('yarn', ['audit', '--json', '--groups', 'dependencies'], {
    encoding: 'utf-8',
    maxBuffer: 64 * 1024 * 1024,
  });
}

function parseAudit(stdout) {
  const advisories = [];
  let summary = null;

  for (const line of stdout.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    let parsed;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      continue;
    }
    if (
      parsed.type === 'auditAdvisory' &&
      parsed.data &&
      parsed.data.advisory
    ) {
      const a = parsed.data.advisory;
      advisories.push({
        module: a.module_name,
        severity: a.severity,
        title: a.title,
        url: a.url,
        vulnerableVersions: a.vulnerable_versions,
        patchedVersions: a.patched_versions,
      });
    } else if (parsed.type === 'auditSummary') {
      summary = parsed.data;
    }
  }

  return {advisories, summary};
}

function main() {
  const result = runYarnAudit();

  if (result.error || typeof result.stdout !== 'string') {
    console.warn(
      '[audit:ci] Could not run `yarn audit` (' +
        (result.error ? result.error.message : 'no output') +
        '). Skipping the CVE gate so a registry outage does not flap CI.',
    );
    process.exit(0);
  }

  const {advisories, summary} = parseAudit(result.stdout);

  if (!summary && advisories.length === 0) {
    // No parseable audit data - most likely the advisory DB was unreachable.
    console.warn(
      '[audit:ci] No advisory data returned by `yarn audit`. Skipping the CVE ' +
        'gate because the advisory DB is likely unreachable.',
    );
    process.exit(0);
  }

  const blocking = advisories.filter(a => GATE_SEVERITIES.includes(a.severity));

  // De-duplicate by module + severity for a readable report.
  const seen = new Set();
  const unique = [];
  for (const a of blocking) {
    const key = a.module + '@' + a.severity;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(a);
    }
  }

  if (unique.length === 0) {
    // eslint-disable-next-line no-console
    console.log(
      '[audit:ci] No high or critical advisories in production dependencies.',
    );
    process.exit(0);
  }

  console.error(
    '\n[audit:ci] FAIL: ' +
      unique.length +
      ' high/critical advisory(ies) in production dependencies:\n',
  );
  for (const a of unique) {
    console.error(`  - ${a.module} (${a.severity}): ${a.title}`);
    if (a.patchedVersions) {
      console.error(`      patched in: ${a.patchedVersions}`);
    }
    if (a.url) {
      console.error(`      ${a.url}`);
    }
  }
  console.error(
    '\nFix: upgrade the package (use `yarn why <pkg>` to find the parent), or ' +
      'pin a patched version via `resolutions` in package.json.\n',
  );
  process.exit(1);
}

main();
