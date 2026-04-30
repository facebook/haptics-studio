/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import path from 'path';
import fs from 'fs';
import CrashReporter from '../src/crashReporter';
import Analytics from '../src/analytics';

describe('Crash reporter', () => {
  const tmpPath = path.join(path.resolve(__dirname), '..', 'tmp', 'crashes');
  const pendingPath = path.join(tmpPath, 'pending');
  const crashReporter = new CrashReporter(tmpPath);

  beforeEach(() => {
    if (fs.existsSync(pendingPath)) {
      fs.rmSync(pendingPath, {recursive: true, force: true});
    }
  });

  describe('when there are crashes', () => {
    beforeEach(() => {
      fs.mkdirSync(pendingPath, {recursive: true});
      fs.writeFileSync(
        path.join(pendingPath, 'test-1234567890.txt'),
        'test crash report',
      );
      fs.writeFileSync(
        path.join(pendingPath, 'test-1234567891.txt'),
        'test crash report',
      );
    });

    it('should call the Analytics helper', () => {
      jest.spyOn(Analytics.instance, 'addErrorEvent').mockReturnValue();
      crashReporter.sendCrashReports();
      expect(Analytics.instance.addErrorEvent).toHaveBeenCalledTimes(2);
    });
  });

  describe('when there are no crashes', () => {
    it('should not call the Analytics helper', () => {
      jest.spyOn(Analytics.instance, 'addErrorEvent').mockReturnValue();
      crashReporter.sendCrashReports();
      expect(Analytics.instance.addErrorEvent).toHaveBeenCalledTimes(0);
    });
  });
});
