/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';
import { readFile } from 'fs/promises';
import { Page } from '@playwright/test';

export const delay = (ms: number): Promise<void> => new Promise(res => setTimeout(res, ms));

export async function dropTestFile(page: Page, testId: string, file?: string): Promise<void> {
  const filePath = `./e2e/test/${file ?? 'test.wav'}`;
  const buffer = await readFile(filePath);

  const dataTransfer = await page.evaluateHandle((data) => {
    const dt = new DataTransfer();
    // Convert the buffer to a hex array
    const file = new File([data.buffer.toString('hex')], data.path, { type: 'audio/wav' });
    dt.items.add(file);
    return dt;
  }, { buffer, path: path.join(__dirname, file ?? 'test.wav') });

  await page.getByTestId(testId).dispatchEvent('drop', { dataTransfer });
  await delay(1000);
}

export async function acceptTerms(page: Page): Promise<void> {
  if (await page.getByRole('button', { name: 'I Accept' }).count() > 0) {
    await page.getByRole('button', { name: 'I Accept' }).click();
    await delay(100);
  }
}
