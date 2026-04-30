/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// uuid v14 ships ESM-only (`"type": "module"`) which Jest with ts-jest
// cannot parse without invasive ESM-mode configuration. This
// codebase only uses `v4` from uuid, so we map `import 'uuid'` to this
// CommonJS shim during tests via moduleNameMapper in jest.config.js.

import {randomUUID} from 'crypto';

export const v4 = (): string => randomUUID();
