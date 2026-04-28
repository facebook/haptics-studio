/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Build script for native extensions using @napi-rs/cli (devDependency).
 *
 * On macOS: builds x64 and arm64 binaries, then combines them into a
 * universal binary via `napi universalize`.
 * On Windows: builds a single x64 binary.
 * On both: generates TypeScript types via typeshare.
 *
 * Reads napi config (binaryName, targets) from package.json.
 */

const {spawnSync} = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const HAPTIC_SDK_SUBMODULE_PATH = 'third-party/haptics-sdk';
const HAPTIC_SDK_WORKSPACE = path.join(PROJECT_ROOT, HAPTIC_SDK_SUBMODULE_PATH);
const NAPI_CRATE_MANIFEST = path.join(
  HAPTIC_SDK_WORKSPACE,
  'interfaces/studio/napi/Cargo.toml',
);
const HAPTICS_SDK_TYPES_FILEPATH = path.resolve(
  __dirname,
  '../main/src/types/haptics_sdk_types.ts',
);

const forceRebuild = process.argv.includes('--force');
const skipTypeshare = process.argv.includes('--skip-typeshare');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const run = (cmd, args, opts = {}) => {
  const result = spawnSync(cmd, args, {stdio: 'inherit', ...opts});
  if (result.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(' ')}`);
  }
  return result;
};

// npx is a .cmd script on Windows, which requires shell: true to resolve.
// On macOS/Linux npx is a real executable, so we skip shell to avoid the
// DEP0190 deprecation warning.
const runNapi = (args, opts = {}) => {
  const shell = process.platform === 'win32';
  return run('npx', ['napi', ...args], {cwd: PROJECT_ROOT, shell, ...opts});
};

/**
 * Build haptics_sdk_napi for a single target using `napi build`.
 *
 * When usePlatformSuffix is true, napi build names the output using the
 * binaryName from package.json's napi config and appends the platform triple,
 * e.g. HapticsSDK.darwin-arm64.node. This is needed on macOS so that
 * `napi universalize` can find and combine the arch-specific binaries.
 *
 * When usePlatformSuffix is false (Windows), the output is just
 * HapticsSDK.node directly — no combining step needed.
 */
const napiBuild = (outputDir, profile, targetTriple, usePlatformSuffix) => {
  fs.mkdirSync(outputDir, {recursive: true});

  const args = [
    'build',
    '--manifest-path',
    NAPI_CRATE_MANIFEST,
    '-p',
    'haptics_sdk_napi',
    '--cwd',
    PROJECT_ROOT,
    '-o',
    outputDir,
    '--no-js',
    '--no-dts-header',
    '--target',
    targetTriple,
    ...(usePlatformSuffix ? ['--platform'] : []),
    ...(profile === 'release' ? ['--release', '--strip'] : []),
  ];

  console.log(
    `Building haptics_sdk_napi [${profile}] [${targetTriple}]` +
      ` -> ${path.relative(process.cwd(), outputDir)}`,
  );

  runNapi(args);
};

/**
 * Clean up the empty index.d.ts that napi build always generates.
 * We use typeshare for TypeScript types instead.
 */
const cleanupDts = binPath => {
  const dts = path.join(binPath, 'index.d.ts');
  if (fs.existsSync(dts)) fs.unlinkSync(dts);
};

// ---------------------------------------------------------------------------
// Platform builds
// ---------------------------------------------------------------------------

const buildMacEnvironment = environment => {
  const profile = environment === 'development' ? 'debug' : 'release';
  const binPath = path.resolve(`native/bin/mac/${environment}`);
  const universalPath = path.join(binPath, 'HapticsSDK.darwin-universal.node');
  const finalPath = path.join(binPath, 'HapticsSDK.node');

  if (!forceRebuild && fs.existsSync(finalPath)) {
    console.log(
      `Native extensions found at ${binPath}, skipping. Use --force to rebuild.`,
    );
    return;
  }

  // Build both architectures — napi produces HapticsSDK.darwin-x64.node
  // and HapticsSDK.darwin-arm64.node in the output dir
  napiBuild(binPath, profile, 'x86_64-apple-darwin', true);
  napiBuild(binPath, profile, 'aarch64-apple-darwin', true);

  // Combine into HapticsSDK.darwin-universal.node via lipo
  console.log(
    `Universalizing -> ${path.relative(process.cwd(), universalPath)}`,
  );
  runNapi(['universalize', '--cwd', PROJECT_ROOT, '-o', binPath]);

  // Rename to HapticsSDK.node for the Electron app
  fs.renameSync(universalPath, finalPath);

  // Clean up arch-specific intermediates from napi build --platform
  for (const file of [
    'HapticsSDK.darwin-x64.node',
    'HapticsSDK.darwin-arm64.node',
  ]) {
    const p = path.join(binPath, file);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  cleanupDts(binPath);
};

const buildWinEnvironment = environment => {
  const profile = environment === 'development' ? 'debug' : 'release';
  const binPath = path.resolve(`native/bin/win/${environment}`);
  const finalPath = path.join(binPath, 'HapticsSDK.node');

  if (!forceRebuild && fs.existsSync(finalPath)) {
    console.log(
      `Native extensions found at ${binPath}, skipping. Use --force to rebuild.`,
    );
    return;
  }

  // Single architecture build — napi produces HapticsSDK.node directly
  napiBuild(binPath, profile, 'x86_64-pc-windows-msvc', false);

  cleanupDts(binPath);
};

// ---------------------------------------------------------------------------
// TypeScript bindings (via typeshare, not napi's built-in .d.ts)
// ---------------------------------------------------------------------------

const generateTypeScriptBindings = () => {
  console.log('Generating TypeScript bindings with typeshare...');

  const typeshareArgs = [
    '--lang',
    'typescript',
    '--output-file',
    HAPTICS_SDK_TYPES_FILEPATH,
    'core/',
    'interfaces/studio/audio_analysis',
    'interfaces/studio/napi',
  ];

  // On Windows, `which` is not available — use `where` instead
  const whichCmd = process.platform === 'win32' ? 'where' : 'which';
  const which = spawnSync(whichCmd, ['typeshare'], {stdio: 'pipe'});
  if (which.status !== 0) {
    console.log('typeshare not in PATH, installing via cargo...');
    run('cargo', ['install', 'typeshare-cli']);
  }

  run('typeshare', typeshareArgs, {cwd: HAPTIC_SDK_WORKSPACE});

  // typeshare doesn't generate a Duration type, so add it manually
  fs.appendFileSync(
    HAPTICS_SDK_TYPES_FILEPATH,
    `\nexport type Duration = {\n\tsecs: number,\n\tnanos: number,\n};\n`,
  );

  console.log(`TypeScript bindings written to ${HAPTICS_SDK_TYPES_FILEPATH}`);
};

// ---------------------------------------------------------------------------
// Verify tools
// ---------------------------------------------------------------------------

const ensureSubmodule = () => {
  if (fs.existsSync(NAPI_CRATE_MANIFEST)) return;

  console.warn(
    `Native sources missing at ${HAPTIC_SDK_SUBMODULE_PATH}.\n` +
      `Initialize the submodule before building:\n` +
      `  git submodule update --init --recursive -- ${HAPTIC_SDK_SUBMODULE_PATH}`,
  );
  process.exit(1);
};

const verifyTools = () => {
  ensureSubmodule();

  const cargo = spawnSync('cargo', ['--version'], {stdio: 'pipe'});
  if (cargo.status !== 0) {
    throw new Error('cargo not found. Install Rust: https://rustup.rs');
  }

  const napi = spawnSync('npx', ['napi', 'version'], {
    stdio: 'pipe',
    shell: process.platform === 'win32',
    cwd: PROJECT_ROOT,
  });
  if (napi.status !== 0) {
    throw new Error(
      '@napi-rs/cli not found. Run `yarn install` to install dependencies.',
    );
  }

  // Ensure both macOS targets are installed (only needed on macOS)
  if (process.platform === 'darwin') {
    const targets = spawnSync('rustup', ['target', 'list', '--installed'], {
      stdio: 'pipe',
    });
    const installed = targets.stdout.toString();
    for (const triple of ['x86_64-apple-darwin', 'aarch64-apple-darwin']) {
      if (!installed.includes(triple)) {
        console.log(`Installing Rust target: ${triple}`);
        run('rustup', ['target', 'add', triple]);
      }
    }
  }
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

verifyTools();

if (process.platform === 'darwin') {
  buildMacEnvironment('development');
  buildMacEnvironment('production');
} else if (process.platform === 'win32') {
  buildWinEnvironment('development');
  buildWinEnvironment('production');
} else {
  console.warn(`Unsupported platform: ${process.platform}`);
  process.exit(1);
}

if (!skipTypeshare) {
  generateTypeScriptBindings();
}

console.log('\nDone.');
