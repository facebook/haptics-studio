/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import faker from 'faker';

import listeners from '../../src/listeners/ws';
import {IPCMessage} from '../../src/listeners';
import {ipcRenderer} from '../mocks/electron';
import WSServer from '../../src/wsServer';
import Project from '../../src/common/project';

describe('websocket listeners', () => {
  const clipId = faker.datatype.uuid();
  const sessionId = faker.datatype.uuid();

  let response: IPCMessage;

  beforeAll(() => {
    // setup listeners
    listeners();
  });

  beforeEach(() => {
    jest.spyOn(Project.instance, 'getState').mockReturnValue({sessionId, clipId});
    jest.spyOn(WSServer.instance, 'sendToRoom').mockImplementation();
  });

  describe('setPlayhead', () => {
    const testAction = 'set_playhead';
    const playhead = faker.datatype.number();

    describe('when sessionId is not missing', () => {
      beforeEach(async () => {
        const message = {playhead: `${playhead}`, clipId, sessionId};
        response = await ipcRenderer.invoke(testAction, message);
      });
      it('should return a message with status ok', () => {
        const {status, action, payload} = response;
        expect(status).toEqual('ok');
        expect(action).toEqual(testAction);
        expect(payload).toEqual({});
      });

      it('should call ws send once', () => {
        expect(WSServer.instance.sendToRoom).toHaveBeenCalledTimes(1);
        expect(WSServer.instance.sendToRoom).toHaveBeenCalledWith(testAction, {
          playhead: `${playhead}`,
        });
      });
    });
  });
});
