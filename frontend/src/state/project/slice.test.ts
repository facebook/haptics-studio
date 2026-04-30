/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {v4 as uuidv4} from 'uuid';
import {defaultDspSettings, packDspSettings} from '../dsp';
import {RootState, createStore, initialValues} from '../store';
import projectSlice from './slice';
import editorDataMock from '../../__mocks__/editorDataMock';
import editorEmptyDataMock from '../../__mocks__/editorEmptyDataMock';
import {EmphasisType, EnvelopeType, TimelineCursorType} from '../types';
import {frequencyForSharpness} from '../../globals/utils';
import appSlice from '../app/slice';
import editingToolsSlice from '../editingTools/slice';
import Constants from '../../globals/constants';

describe('project slice', () => {
  const clipId = uuidv4();
  const clipId2 = uuidv4();
  const clipId3 = uuidv4();
  const mock = editorDataMock;
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore({
      ...initialValues,
      project: {
        ...initialValues.project,
        groups: [
          {id: 'group1', name: 'clip1', isFolder: false, clips: [clipId]},
          {id: 'group2', name: 'clip2', isFolder: false, clips: [clipId2]},
          {id: 'group3', name: 'clip3', isFolder: false, clips: [clipId3]},
        ],
        currentClipId: clipId,
        clips: {
          [clipId]: {
            name: 'Clip',
            loading: false,
            failed: false,
            error: undefined,
            audio: {path: '/path/clip1.wav'},
            svg: mock.svg,
            hasChanges: {
              amplitude: false,
              frequency: false,
            },
            timeline: {duration: 1, samples: 10, startTime: 0, endTime: 0.5},
            playhead: 0,
            markers: [],
            trimAt: undefined,
            state: {
              past: [
                {
                  revision: 1,
                  dsp: defaultDspSettings(),
                  haptic: mock.haptic,
                  selectedPoints: [],
                  selectedEmphasis: undefined,
                },
              ],
              future: [
                {
                  revision: 3,
                  dsp: defaultDspSettings(),
                  haptic: mock.haptic,
                  selectedPoints: [],
                  selectedEmphasis: undefined,
                },
              ],
              present: {
                revision: 2,
                dsp: defaultDspSettings(),
                haptic: mock.haptic,
                selectedPoints: [],
                selectedEmphasis: undefined,
              },
            },
          },
          [clipId2]: {
            name: 'Clip 2',
            loading: false,
            failed: false,
            error: undefined,
            audio: {path: '/path/clip2.wav'},
            svg: mock.svg,
            hasChanges: {
              amplitude: false,
              frequency: false,
            },
            timeline: {duration: 1, samples: 10, startTime: 0, endTime: 0.5},
            playhead: 0,
            markers: [],
            trimAt: undefined,
            state: {
              past: [],
              future: [],
              present: {
                revision: 0,
                dsp: defaultDspSettings(),
                haptic: mock.haptic,
                selectedPoints: [],
                selectedEmphasis: undefined,
              },
            },
          },
          [clipId3]: {
            name: 'Empty Clip',
            loading: false,
            failed: false,
            error: undefined,
            audio: undefined,
            svg: mock.svg,
            hasChanges: {
              amplitude: false,
              frequency: false,
            },
            timeline: {duration: 1, samples: 10, startTime: 0, endTime: 0.5},
            playhead: 0,
            markers: [],
            trimAt: undefined,
            state: {
              past: [],
              future: [],
              present: {
                revision: 0,
                dsp: defaultDspSettings(),
                haptic: editorEmptyDataMock.haptic,
                selectedPoints: [],
                selectedEmphasis: undefined,
              },
            },
          },
        },
      },
    });
  });

  describe('analyzeFiles', () => {
    it('should add the new clips and set the current clip', () => {
      store.dispatch(
        projectSlice.actions.analyzeFiles({
          files: [
            {name: 'file1', path: '/folder/file1.wav'} as any as File,
            {name: 'file2', path: '/folder/file2.wav'} as any as File,
          ],
          settings: defaultDspSettings(),
        }),
      );
      const state = (store.getState() as RootState).project;
      expect(state.groups.length).toEqual(5);
      expect(state.currentClipId).toEqual(state.groups[3].clips[0]);
      expect(state.selection.clips).toEqual([state.groups[3].clips[0]]);
    });
  });

  describe('splitStereoAudio', () => {
    it('should add two new clips', () => {
      let state = (store.getState() as RootState).project;
      const previousCount = state.groups.length;
      store.dispatch(
        projectSlice.actions.splitStereoAudio({
          clipId,
        }),
      );
      state = (store.getState() as RootState).project;
      expect(state.groups.length).toEqual(previousCount + 2);
      const leftId = state.groups[1].clips[0];
      const rightId = state.groups[2].clips[0];
      expect(state.clips[leftId].name).toEqual('Clip_L');
      expect(state.clips[rightId].name).toEqual('Clip_R');
    });
  });

  describe('analysisSuccess', () => {
    it('should update the state of the clip', () => {
      store.dispatch(
        projectSlice.actions.analysisSuccess({
          name: 'AudioClip',
          clipId,
          settings: packDspSettings(defaultDspSettings()),
          svg: mock.svg,
          haptic: mock.haptic,
          audio: {
            path: './AudioClip.wav',
          },
        }),
      );
      const state = (store.getState() as RootState).project;
      expect(state.clips[clipId].svg).toEqual(mock.svg);
      expect(state.clips[clipId].loading).toEqual(false);
      expect(state.clips[clipId].name).toEqual('AudioClip');
      expect(state.clips[clipId].audio?.path).toEqual('./AudioClip.wav');
      expect(state.clips[clipId].state.present.revision).toEqual(3);
      expect(state.clips[clipId].state.present.haptic).toEqual(mock.haptic);
      expect(state.clips[clipId].state.present.selectedPoints).toEqual([]);
    });
  });

  describe('analysisFailure', () => {
    it('should update the state of the clip with the error', () => {
      store.dispatch(
        projectSlice.actions.analysisFailure({
          clipId,
          error: 'analysis failed',
        }),
      );
      const state = (store.getState() as RootState).project;
      expect(state.clips[clipId].loading).toEqual(false);
      expect(state.clips[clipId].failed).toEqual(true);
      expect(state.clips[clipId].error).toEqual('analysis failed');
    });
  });

  describe('setCurrentSession', () => {
    it('should set the session id', () => {
      store.dispatch(
        projectSlice.actions.setCurrentSession({sessionId: 'session'}),
      );
      expect((store.getState() as RootState).project.sessionId).toEqual(
        'session',
      );
    });
  });

  describe('openProject', () => {
    it('should set the loading state', () => {
      store.dispatch(projectSlice.actions.openProject({project: {}}));
      expect((store.getState() as RootState).project.loading).toEqual(true);
    });
  });

  describe('openProjectSuccess', () => {
    it('should set the loading state', () => {
      store.dispatch(
        projectSlice.actions.openProjectSuccess({
          project: {
            sessionId: 'session',
            clips: [
              {
                name: 'Clip',
                audio: {path: '/path', exists: true},
                svg: mock.svg,
                haptic: mock.haptic,
                settings: packDspSettings(defaultDspSettings()),
                clipId,
                markers: [],
                lastUpdate: 0,
              },
            ],
            groups: [
              {
                id: 'group1',
                name: 'Group',
                clips: [clipId],
                isFolder: true,
              },
            ],
            name: 'project',
            lastOpenedClipId: clipId,
            projectExists: true,
            isSample: false,
            isTutorial: false,
            isAuthoringTutorial: false,
          },
        }),
      );
      const state = (store.getState() as RootState).project;
      expect(state.clips[clipId].svg).toEqual(mock.svg);
      expect(state.clips[clipId].loading).toEqual(false);
      expect(state.clips[clipId].state.present.revision).toEqual(0);
      expect(state.clips[clipId].state.present.haptic).toEqual(mock.haptic);
      expect(state.clips[clipId].state.present.selectedPoints).toEqual([]);
      expect(state.currentClipId).toEqual(clipId);
    });

    it('should set the first clip of the first group if lastOpenedClipId is undefined', () => {
      store.dispatch(
        projectSlice.actions.openProjectSuccess({
          project: {
            sessionId: 'session',
            clips: [
              {
                name: 'Clip',
                audio: {path: '/path', exists: true},
                svg: mock.svg,
                haptic: mock.haptic,
                settings: packDspSettings(defaultDspSettings()),
                clipId,
                markers: [],
                lastUpdate: 0,
              },
              {
                name: 'Clip',
                audio: {path: '/path', exists: true},
                svg: mock.svg,
                haptic: mock.haptic,
                settings: packDspSettings(defaultDspSettings()),
                clipId: 'clip2',
                markers: [],
                lastUpdate: 0,
              },
            ],
            groups: [
              {
                id: 'group1',
                name: 'Group',
                clips: ['clip2', clipId],
                isFolder: true,
              },
            ],
            name: 'project',
            lastOpenedClipId: undefined,
            projectExists: true,
            isSample: false,
            isTutorial: false,
            isAuthoringTutorial: false,
          },
        }),
      );
      const state = (store.getState() as RootState).project;
      expect(state.currentClipId).toEqual('clip2');
    });
  });

  describe('projectInfo', () => {
    it('should set name, type and open state of the project', () => {
      store.dispatch(
        projectSlice.actions.projectInfo({
          name: 'my-project',
          isSampleProject: true,
        }),
      );
      expect((store.getState() as RootState).project.name).toEqual(
        'my-project',
      );
      expect((store.getState() as RootState).project.isOpen).toEqual(true);
      expect((store.getState() as RootState).project.isSample).toEqual(true);
    });
  });

  describe('closeProject', () => {
    it('should restore the project state', () => {
      store.dispatch(projectSlice.actions.closeProject());
      expect((store.getState() as RootState).project.sessionId).toEqual(
        undefined,
      );
      expect((store.getState() as RootState).project.name).toEqual(undefined);
      expect((store.getState() as RootState).project.isOpen).toEqual(false);
      expect((store.getState() as RootState).project.clips).toEqual({});
      expect((store.getState() as RootState).project.groups).toEqual([]);
    });
  });

  describe('setCurrentClip', () => {
    it('should set the clip as current', () => {
      store.dispatch(projectSlice.actions.setCurrentClip({id: clipId}));
      expect((store.getState() as RootState).project.currentClipId).toEqual(
        clipId,
      );
    });

    it('should not set a clip if not part of the current project', () => {
      const newClipId = uuidv4();
      store.dispatch(projectSlice.actions.setCurrentClip({id: clipId}));
      store.dispatch(projectSlice.actions.setCurrentClip({id: newClipId}));
      expect((store.getState() as RootState).project.currentClipId).toEqual(
        clipId,
      );
    });
  });

  describe('selectClip', () => {
    it('should set the clip as selected', () => {
      store.dispatch(
        projectSlice.actions.selectClip({id: clipId, add: false, range: false}),
      );
      expect((store.getState() as RootState).project.selection.clips).toEqual([
        clipId,
      ]);
    });

    it('should add clips to the selection with the add modifier', () => {
      store.dispatch(
        projectSlice.actions.selectClip({id: clipId, add: false, range: false}),
      );
      store.dispatch(
        projectSlice.actions.selectClip({id: clipId3, add: true, range: false}),
      );
      expect((store.getState() as RootState).project.selection.clips).toEqual([
        clipId,
        clipId3,
      ]);
    });

    it('should add clips to the selection with the range modifier', () => {
      store.dispatch(
        projectSlice.actions.selectClip({id: clipId, add: false, range: false}),
      );
      store.dispatch(
        projectSlice.actions.selectClip({id: clipId3, add: false, range: true}),
      );
      expect((store.getState() as RootState).project.selection.clips).toEqual([
        clipId,
        clipId2,
        clipId3,
      ]);
    });
  });

  describe('selectAllClips', () => {
    it('should set all the clips as selected', () => {
      store.dispatch(projectSlice.actions.selectAllClips());
      expect((store.getState() as RootState).project.selection.clips).toEqual([
        clipId,
        clipId2,
        clipId3,
      ]);
    });
  });

  describe('setAndSelectNextClip', () => {
    it('should set the next clip as selected and current', () => {
      store.dispatch(
        projectSlice.actions.selectClip({id: clipId, add: false, range: false}),
      );
      store.dispatch(projectSlice.actions.setAndSelectNextClip());
      expect((store.getState() as RootState).project.selection.clips).toEqual([
        clipId2,
      ]);
      expect((store.getState() as RootState).project.currentClipId).toEqual(
        clipId2,
      );
    });
  });

  describe('setAndSelectPreviousClip', () => {
    it('should set the previous clip as selected and current', () => {
      store.dispatch(
        projectSlice.actions.selectClip({
          id: clipId3,
          add: false,
          range: false,
        }),
      );
      store.dispatch(projectSlice.actions.setAndSelectPreviousClip());
      expect((store.getState() as RootState).project.selection.clips).toEqual([
        clipId2,
      ]);
      expect((store.getState() as RootState).project.currentClipId).toEqual(
        clipId2,
      );
    });
  });

  describe('groupSelectedClips', () => {
    it('should create a group with the selected clips', () => {
      store.dispatch(
        projectSlice.actions.selectClips({ids: [clipId, clipId2, clipId3]}),
      );
      expect(
        (store.getState() as RootState).project.selection.clips.length,
      ).toEqual(3);
      store.dispatch(projectSlice.actions.groupSelectedClips());
      expect(
        (store.getState() as RootState).project.groups[0].clips.length,
      ).toEqual(3);
      expect((store.getState() as RootState).project.groups[0].name).toEqual(
        'untitled',
      );
      expect(
        (store.getState() as RootState).project.groups[0].isFolder,
      ).toEqual(true);
    });
  });

  describe('renameClipGroup', () => {
    it('should rename the selected group', () => {
      store.dispatch(
        projectSlice.actions.selectClips({ids: [clipId, clipId2, clipId3]}),
      );
      expect(
        (store.getState() as RootState).project.selection.clips.length,
      ).toEqual(3);
      store.dispatch(projectSlice.actions.groupSelectedClips());
      const groupId = (store.getState() as RootState).project.groups[0].id;
      store.dispatch(
        projectSlice.actions.renameClipGroup({id: groupId, name: 'new-group'}),
      );
      expect((store.getState() as RootState).project.groups[0].name).toEqual(
        'new-group',
      );
    });
  });

  describe('setCurrentClip', () => {
    it('should set the current clip', () => {
      store.dispatch(projectSlice.actions.setCurrentClip({id: clipId2}));
      expect((store.getState() as RootState).project.currentClipId).toEqual(
        clipId2,
      );
    });
  });

  describe('moveClips', () => {
    it('should move the clip before another one', () => {
      store.dispatch(projectSlice.actions.selectClips({ids: [clipId2]}));
      store.dispatch(projectSlice.actions.moveSelectedClips({index: 0}));
      expect(
        (store.getState() as RootState).project.groups.map(g => g.clips[0]),
      ).toEqual([clipId2, clipId, clipId3]);
    });

    it('should move the clip inside a group', () => {
      store.dispatch(
        projectSlice.actions.selectClips({ids: [clipId2, clipId3]}),
      );
      store.dispatch(projectSlice.actions.groupSelectedClips());
      store.dispatch(projectSlice.actions.selectClips({ids: [clipId]}));
      const groupId = (store.getState() as RootState).project.groups.find(
        g => g.isFolder,
      )?.id;
      store.dispatch(
        projectSlice.actions.moveSelectedClips({toGroup: groupId, index: 1}),
      );
      expect(
        (store.getState() as RootState).project.groups.find(
          g => g.id === groupId,
        )?.clips,
      ).toEqual([clipId2, clipId, clipId3]);
    });
  });

  describe('ungroupClips', () => {
    it('should create new clip groups from the original group', () => {
      store.dispatch(
        projectSlice.actions.selectClips({ids: [clipId, clipId2, clipId3]}),
      );
      store.dispatch(projectSlice.actions.groupSelectedClips());
      expect((store.getState() as RootState).project.groups.length).toEqual(1);
      const groupId = (store.getState() as RootState).project.groups[0].id;
      store.dispatch(
        projectSlice.actions.ungroupClips({
          clips: [clipId, clipId2, clipId3],
          to: groupId,
          position: 'before',
        }),
      );
      expect((store.getState() as RootState).project.groups.length).toEqual(3);
    });
  });

  describe('ungroupClips', () => {
    it('should create new clip groups from the selected clips', () => {
      store.dispatch(
        projectSlice.actions.selectClips({ids: [clipId, clipId2, clipId3]}),
      );
      store.dispatch(projectSlice.actions.groupSelectedClips());
      expect(
        (store.getState() as RootState).project.selection.groups.length,
      ).toEqual(1);
      expect((store.getState() as RootState).project.groups.length).toEqual(1);
      store.dispatch(projectSlice.actions.ungroupSelectedClips());
      expect((store.getState() as RootState).project.groups.length).toEqual(3);
    });
  });

  describe('renameClip', () => {
    it('should change the name of the clip', () => {
      store.dispatch(
        projectSlice.actions.renameClip({
          clipId,
          name: 'new-name',
        }),
      );
      expect(
        (store.getState() as RootState).project.clips[clipId].name,
      ).toEqual('new-name');
    });
  });

  describe('addDuplicatedClips', () => {
    it('should add the new clips and update the groups', () => {
      store.dispatch(
        projectSlice.actions.addDuplicatedClips({
          clips: {
            ...(store.getState() as RootState).project.clips,
            [uuidv4()]: (store.getState() as RootState).project.clips[clipId],
          },
          groups: [
            ...(store.getState() as RootState).project.groups,
            (store.getState() as RootState).project.groups[0],
          ],
        }),
      );
      expect(
        Object.keys((store.getState() as RootState).project.clips).length,
      ).toEqual(4);
      expect((store.getState() as RootState).project.groups.length).toEqual(4);
    });
  });

  describe('undo', () => {
    it('should restore the previous state', () => {
      const present = {
        ...(store.getState() as RootState).project.clips[clipId].state.present,
      };
      store.dispatch(projectSlice.actions.undo({clipId}));
      const {state} = (store.getState() as RootState).project.clips[clipId];
      expect(state.future[0].revision).toEqual(present.revision);
      expect(state.present.revision).toEqual(present.revision - 1);
      expect(state.past).toEqual([]);
    });
  });

  describe('redo', () => {
    it('should restore the future state', () => {
      const present = {
        ...(store.getState() as RootState).project.clips[clipId].state.present,
      };
      store.dispatch(projectSlice.actions.redo({clipId}));
      const {state} = (store.getState() as RootState).project.clips[clipId];
      expect(state.present.revision).toEqual(present.revision + 1);
      expect(state.future).toEqual([]);
    });
  });

  describe('setSelectedPoints', () => {
    it('should set the point selection array', () => {
      store.dispatch(
        projectSlice.actions.setSelectedPoints({clipId, points: [1, 2, 3]}),
      );
      const {state} = (store.getState() as RootState).project.clips[clipId];
      expect(state.present.selectedPoints).toEqual([1, 2, 3]);
    });
  });

  describe('selectAllPoints', () => {
    it('should select all the points of the amplitude envelope', () => {
      store.dispatch(
        projectSlice.actions.selectAllPoints({
          clipId,
          envelope: EnvelopeType.Amplitude,
        }),
      );
      const {state} = (store.getState() as RootState).project.clips[clipId];
      expect(state.present.selectedPoints).toEqual(
        mock.haptic.signals.continuous.envelopes.amplitude.map((p, idx) => idx),
      );
    });

    it('should select all the points of the frequency envelope', () => {
      store.dispatch(
        projectSlice.actions.selectAllPoints({
          clipId,
          envelope: EnvelopeType.Frequency,
        }),
      );
      const {state} = (store.getState() as RootState).project.clips[clipId];
      expect(state.present.selectedPoints).toEqual(
        mock.haptic.signals.continuous.envelopes.frequency.map((p, idx) => idx),
      );
    });
  });

  describe('editPoints', () => {
    it('should update the points values without changing the time position of the first point', () => {
      store.dispatch(
        projectSlice.actions.editPoints({
          clipId,
          envelope: EnvelopeType.Amplitude,
          points: [
            {index: 0, x: 0.1, y: 0.5},
            {index: 1, x: 0.2, y: 1},
          ],
        }),
      );
      const state = (store.getState() as RootState).project.clips[clipId].state
        .present;
      expect(
        state.haptic?.signals.continuous.envelopes.amplitude[0].time,
      ).toEqual(0);
      expect(
        state.haptic?.signals.continuous.envelopes.amplitude[0].amplitude,
      ).toEqual(0.5);
      expect(
        state.haptic?.signals.continuous.envelopes.amplitude[1].time,
      ).toEqual(0.2);
      expect(
        state.haptic?.signals.continuous.envelopes.amplitude[1].amplitude,
      ).toEqual(1.0);
    });
  });

  describe('editPointsValue', () => {
    it('should update the selected points values', () => {
      store.dispatch(
        projectSlice.actions.editPointsValue({
          clipId,
          envelope: EnvelopeType.Amplitude,
          indices: [1, 2, 3],
          value: 0.42,
        }),
      );
      const state = (store.getState() as RootState).project.clips[clipId].state
        .present;
      expect(
        state.haptic?.signals.continuous.envelopes.amplitude[1].amplitude,
      ).toEqual(0.42);
      expect(
        state.haptic?.signals.continuous.envelopes.amplitude[2].amplitude,
      ).toEqual(0.42);
      expect(
        state.haptic?.signals.continuous.envelopes.amplitude[3].amplitude,
      ).toEqual(0.42);
    });
  });

  describe('editSelectionValue', () => {
    it('should update the selected points values', () => {
      store.dispatch(
        projectSlice.actions.setSelectedPoints({clipId, points: [1, 2, 3]}),
      );
      store.dispatch(
        projectSlice.actions.editSelectionValue({
          clipId,
          envelope: EnvelopeType.Amplitude,
          value: 0.5,
        }),
      );
      const state = (store.getState() as RootState).project.clips[clipId].state
        .present;
      expect(
        state.haptic?.signals.continuous.envelopes.amplitude[1].amplitude,
      ).toEqual(0.5);
      expect(
        state.haptic?.signals.continuous.envelopes.amplitude[2].amplitude,
      ).toEqual(0.5);
      expect(
        state.haptic?.signals.continuous.envelopes.amplitude[3].amplitude,
      ).toEqual(0.5);
    });
  });

  describe('editSelectionTime', () => {
    it('should update the time for the selected points', () => {
      store.dispatch(
        projectSlice.actions.setSelectedPoints({clipId, points: [1]}),
      );

      store.dispatch(
        projectSlice.actions.editSelectionTime({
          clipId,
          envelope: EnvelopeType.Amplitude,
          time: 0.15,
        }),
      );
      expect(
        (store.getState() as RootState).project.clips[clipId].state.present
          .haptic?.signals.continuous.envelopes.amplitude[1].time,
      ).toEqual(0.15);
    });

    it('should not update the time for the first envelope point', () => {
      store.dispatch(
        projectSlice.actions.setSelectedPoints({clipId, points: [0]}),
      );

      store.dispatch(
        projectSlice.actions.editSelectionTime({
          clipId,
          envelope: EnvelopeType.Amplitude,
          time: 0.15,
        }),
      );
      expect(
        (store.getState() as RootState).project.clips[clipId].state.present
          .haptic?.signals.continuous.envelopes.amplitude[0].time,
      ).toEqual(0);
    });

    it('should update the time for the last envelope point', () => {
      const lastIndex =
        ((store.getState() as RootState).project.clips[clipId].state.present
          .haptic?.signals.continuous.envelopes.amplitude.length ?? 0) - 1;
      store.dispatch(
        projectSlice.actions.setSelectedPoints({clipId, points: [lastIndex]}),
      );

      store.dispatch(
        projectSlice.actions.editSelectionTime({
          clipId,
          envelope: EnvelopeType.Amplitude,
          time: 0.85,
        }),
      );
      expect(
        (store.getState() as RootState).project.clips[clipId].state.present
          .haptic?.signals.continuous.envelopes.amplitude[lastIndex].time,
      ).toEqual(0.85);
    });
  });

  describe('editSelectionEmphasisAmplitude', () => {
    it('should update the selected points emphasis amplitude', () => {
      store.dispatch(
        projectSlice.actions.setSelectedPoints({clipId, points: [6, 7]}),
      );
      store.dispatch(
        projectSlice.actions.editSelectionEmphasisAmplitude({
          clipId,
          value: 0.1,
        }),
      );
      const state = (store.getState() as RootState).project.clips[clipId].state
        .present;
      expect(
        state.haptic?.signals.continuous.envelopes.amplitude[6].emphasis
          ?.amplitude,
      ).toEqual(0.1);
      expect(
        state.haptic?.signals.continuous.envelopes.amplitude[7].emphasis
          ?.amplitude,
      ).toEqual(0.1);
    });
  });

  describe('editSelectionEmphasisFrequency', () => {
    it('should update the selected points emphasis frequency', () => {
      store.dispatch(
        projectSlice.actions.setSelectedPoints({clipId, points: [6, 7]}),
      );
      store.dispatch(
        projectSlice.actions.editSelectionEmphasisFrequency({
          clipId,
          value: 0.1,
        }),
      );
      const state = (store.getState() as RootState).project.clips[clipId].state
        .present;
      expect(
        state.haptic?.signals.continuous.envelopes.amplitude[6].emphasis
          ?.frequency,
      ).toEqual(0.1);
      expect(
        state.haptic?.signals.continuous.envelopes.amplitude[7].emphasis
          ?.frequency,
      ).toEqual(0.1);
    });
  });

  describe('deletePoints', () => {
    it('should remove the points from the envelope', () => {
      const count =
        (store.getState() as RootState).project.clips[clipId].state.present
          .haptic?.signals.continuous.envelopes.amplitude.length ?? 0;
      store.dispatch(
        projectSlice.actions.deletePoints({
          clipId,
          envelope: EnvelopeType.Amplitude,
          indexes: [1, 2],
        }),
      );
      const state = (store.getState() as RootState).project.clips[clipId].state
        .present;
      expect(
        state.haptic?.signals.continuous.envelopes.amplitude.length,
      ).toEqual(count - 2);
    });

    it('should allow deletion of the last point', () => {
      const count =
        (store.getState() as RootState).project.clips[clipId].state.present
          .haptic?.signals.continuous.envelopes.amplitude.length ?? 0;
      store.dispatch(
        projectSlice.actions.deletePoints({
          clipId,
          envelope: EnvelopeType.Amplitude,
          indexes: [count - 1],
        }),
      );
      const state = (store.getState() as RootState).project.clips[clipId].state
        .present;
      expect(
        state.haptic?.signals.continuous.envelopes.amplitude.length,
      ).toEqual(count - 1);
    });
  });

  describe('deletePointRange', () => {
    it('should remove the points in a time range from the envelope', () => {
      store.dispatch(
        projectSlice.actions.deletePointRange({
          clipId,
          envelopes: [EnvelopeType.Amplitude],
          range: {min: 0.1, max: 0.8},
        }),
      );
      const state = (store.getState() as RootState).project.clips[clipId].state
        .present;
      expect(
        state.haptic?.signals.continuous.envelopes.amplitude.length,
      ).toEqual(2);
    });
  });

  describe('addPoint', () => {
    it('should add a new point in the right time slot', () => {
      store.dispatch(
        projectSlice.actions.addPoint({
          clipId,
          envelope: EnvelopeType.Amplitude,
          point: {time: 0.15, amplitude: 0.5},
        }),
      );
      const state = (store.getState() as RootState).project.clips[clipId].state
        .present;
      expect(
        state.haptic?.signals.continuous.envelopes.amplitude[2].time,
      ).toEqual(0.15);
      expect(
        state.haptic?.signals.continuous.envelopes.amplitude[2].amplitude,
      ).toEqual(0.5);
    });

    it('should set the new point as selected', () => {
      store.dispatch(
        projectSlice.actions.addPoint({
          clipId,
          envelope: EnvelopeType.Amplitude,
          point: {time: 0.15, amplitude: 0.5},
        }),
      );
      const state = (store.getState() as RootState).project.clips[clipId].state
        .present;
      expect(state.selectedPoints).toEqual([2]);
    });

    it("should add the starting point to the envelope not being edited if it's empty", () => {
      store.dispatch(
        projectSlice.actions.addPoint({
          clipId: clipId3,
          envelope: EnvelopeType.Amplitude,
          point: {time: 0.15, amplitude: 0.5},
        }),
      );
      const envelope =
        (store.getState() as RootState).project.clips[clipId3].state.present
          .haptic?.signals.continuous.envelopes.frequency ?? [];
      expect(envelope.length).toEqual(1);
      expect(envelope[0].frequency).toEqual(
        Constants.editing.defaultConstantEnvelopeValue,
      );
      expect(envelope[0].time).toEqual(0);
    });
  });

  describe('toggleEmphasisOnSelectedPoints', () => {
    it('should add emphasis to points that do not have it', () => {
      store.dispatch(
        projectSlice.actions.setSelectedPoints({clipId, points: [0, 1]}),
      );
      store.dispatch(
        projectSlice.actions.toggleEmphasisOnSelectedPoints({clipId}),
      );
      const state = (store.getState() as RootState).project.clips[clipId].state
        .present;
      expect(
        state.haptic?.signals.continuous.envelopes.amplitude[0].emphasis,
      ).not.toBeUndefined();
      expect(
        state.haptic?.signals.continuous.envelopes.amplitude[1].emphasis,
      ).not.toBeUndefined();
    });

    it('should duck the amplitude by 80%', () => {
      const previousAmplitude =
        (store.getState() as RootState).project.clips[clipId].state.present
          .haptic?.signals.continuous.envelopes.amplitude[0].amplitude ?? 0;
      store.dispatch(
        projectSlice.actions.setSelectedPoints({clipId, points: [0, 1]}),
      );
      store.dispatch(
        projectSlice.actions.toggleEmphasisOnSelectedPoints({clipId}),
      );
      const state = (store.getState() as RootState).project.clips[clipId].state
        .present;
      expect(
        state.haptic?.signals.continuous.envelopes.amplitude[0].emphasis
          ?.amplitude,
      ).toEqual(previousAmplitude);
      expect(
        state.haptic?.signals.continuous.envelopes.amplitude[0].amplitude,
      ).toEqual(previousAmplitude);
    });

    it('should remove emphasis to point that already have it', () => {
      const previousAmplitude =
        (store.getState() as RootState).project.clips[clipId].state.present
          .haptic?.signals.continuous.envelopes.amplitude[6].amplitude ?? 0;
      store.dispatch(
        projectSlice.actions.setSelectedPoints({clipId, points: [6, 7]}),
      );
      store.dispatch(
        projectSlice.actions.toggleEmphasisOnSelectedPoints({clipId}),
      );
      const state = (store.getState() as RootState).project.clips[clipId].state
        .present;
      expect(
        state.haptic?.signals.continuous.envelopes.amplitude[6].emphasis,
      ).toBeUndefined();
      expect(
        state.haptic?.signals.continuous.envelopes.amplitude[7].emphasis,
      ).toBeUndefined();
      expect(
        state.haptic?.signals.continuous.envelopes.amplitude[6].amplitude,
      ).toEqual(previousAmplitude);
    });
  });

  describe('removeEmphasisFromSelectedPoints', () => {
    it('should remove emphasis from the selected points', () => {
      store.dispatch(
        projectSlice.actions.setSelectedPoints({clipId, points: [6, 7]}),
      );
      store.dispatch(
        projectSlice.actions.removeEmphasisFromSelectedPoints({clipId}),
      );
      const state = (store.getState() as RootState).project.clips[clipId].state
        .present;
      expect(
        state.haptic?.signals.continuous.envelopes.amplitude[6].emphasis,
      ).toBeUndefined();
      expect(
        state.haptic?.signals.continuous.envelopes.amplitude[7].emphasis,
      ).toBeUndefined();
    });
  });

  describe('setEmphasisType', () => {
    it('should set the emphasis frequency', () => {
      store.dispatch(
        projectSlice.actions.setSelectedPoints({clipId, points: [6, 7]}),
      );
      store.dispatch(
        projectSlice.actions.setEmphasisType({
          clipId,
          type: EmphasisType.Sharp,
        }),
      );
      const state = (store.getState() as RootState).project.clips[clipId].state
        .present;
      expect(
        state.haptic?.signals.continuous.envelopes.amplitude[6].emphasis
          ?.frequency,
      ).toEqual(frequencyForSharpness(EmphasisType.Sharp));
      expect(
        state.haptic?.signals.continuous.envelopes.amplitude[7].emphasis
          ?.frequency,
      ).toEqual(frequencyForSharpness(EmphasisType.Sharp));
    });
  });

  describe('pastePoints', () => {
    it('should clear the selected points', () => {
      store.dispatch(
        projectSlice.actions.setSelectedPoints({clipId, points: [6, 7]}),
      );
      store.dispatch(
        projectSlice.actions.pastePoints({
          clipId,
          clipboard: {amplitude: [{time: 0, amplitude: 1}], frequency: []},
        }),
      );
      const state = (store.getState() as RootState).project.clips[clipId].state
        .present;
      expect(state.selectedPoints).toEqual([]);
    });
  });

  describe('confirmPaste', () => {
    it('should insert the clipboard in the envelope at the offset value', () => {
      store.dispatch(
        projectSlice.actions.confirmPaste({
          clipId,
          clipboard: {
            amplitude: [
              {time: 0.1, amplitude: 1},
              {time: 0.2, amplitude: 1},
            ],
            frequency: [
              {time: 0.1, frequency: 1},
              {time: 0.2, frequency: 1},
            ],
          },
          offset: 0.05,
          inPlace: false,
        }),
      );
      const state = (store.getState() as RootState).project.clips[clipId].state
        .present;
      expect(
        state.haptic?.signals.continuous.envelopes.amplitude[3].amplitude,
      ).toEqual(1);
    });
  });

  describe('pasteEmphasisInPlace', () => {
    it('should insert the clipboard in the envelope at the original position', () => {
      store.dispatch(
        projectSlice.actions.pasteEmphasisInPlace({
          clipId,
          points: {
            amplitude: [
              {
                time: 0.1,
                amplitude: 1,
                emphasis: {amplitude: 1, frequency: 0.0},
              },
              {time: 0.2, amplitude: 1},
            ],
            frequency: [
              {time: 0.1, frequency: 1},
              {time: 0.2, frequency: 1},
            ],
          },
        }),
      );
      const state = (store.getState() as RootState).project.clips[clipId].state
        .present;

      expect(
        state.haptic?.signals.continuous.envelopes.amplitude[1].emphasis
          ?.amplitude,
      ).toEqual(1);
    });
  });

  describe('deleteClips', () => {
    it('should remove the clips', () => {
      const previousCount = Object.keys(
        (store.getState() as RootState).project.clips,
      ).length;
      store.dispatch(projectSlice.actions.deleteClips({clipIds: [clipId]}));
      expect(
        Object.keys((store.getState() as RootState).project.clips).length,
      ).toEqual(previousCount - 1);
    });
  });

  describe('setCurrentAnalysis', () => {
    it('should set the clip loading state', () => {
      store.dispatch(projectSlice.actions.setCurrentAnalysis({clipId}));
      expect(
        (store.getState() as RootState).project.clips[clipId].loading,
      ).toEqual(true);
    });
  });

  describe('setTimelineState', () => {
    it('should set timeline state on the clip', () => {
      store.dispatch(
        projectSlice.actions.setTimelineState({
          clipId,
          state: {startTime: 0.1, endTime: 0.2},
          cursor: TimelineCursorType.Center,
        }),
      );
      expect(
        (store.getState() as RootState).project.clips[clipId].timeline
          ?.startTime,
      ).toEqual(0.1);
      expect(
        (store.getState() as RootState).project.clips[clipId].timeline?.endTime,
      ).toEqual(0.2);
    });
  });

  describe('setPlayhead', () => {
    it('should set the playhead state', () => {
      store.dispatch(projectSlice.actions.setPlayhead({clipId, time: 0.5}));
      expect(
        (store.getState() as RootState).project.clips[clipId].playhead,
      ).toEqual(0.5);
    });
  });

  describe('setPlayheadFailure', () => {
    it('should restore the playhead state', () => {
      store.dispatch(projectSlice.actions.setPlayhead({clipId, time: 0.5}));
      expect(
        (store.getState() as RootState).project.clips[clipId].playhead,
      ).toEqual(0.5);
      store.dispatch(
        projectSlice.actions.setPlayheadFailure({clipId, previous: 1}),
      );
      expect(
        (store.getState() as RootState).project.clips[clipId].playhead,
      ).toEqual(1);
    });
  });

  describe('setMissingAsset', () => {
    it('should mark the audio as missing', () => {
      store.dispatch(projectSlice.actions.setMissingAsset({clipId}));
      expect(
        (store.getState() as RootState).project.clips[clipId].audio?.exists,
      ).toEqual(false);
    });
  });

  describe('relocateAsset', () => {
    it('should update the audio property of a clip', () => {
      store.dispatch(
        projectSlice.actions.relocateAsset({
          clipId,
          audio: {path: '/path/to/audio'},
        }),
      );
      expect(
        (store.getState() as RootState).project.clips[clipId].audio?.path,
      ).toEqual('/path/to/audio');
    });
  });

  describe('addAudioToClip', () => {
    it('should update the audio and svg properties of a clip', () => {
      store.dispatch(
        projectSlice.actions.addAudioToClip({
          clipId,
          audio: {path: '/path/to/audio'},
          waveform: {envelope: [{time: 0, amplitude: 0.42}]},
        }),
      );
      expect(
        (store.getState() as RootState).project.clips[clipId].audio?.path,
      ).toEqual('/path/to/audio');
      expect((store.getState() as RootState).project.clips[clipId].svg).toEqual(
        {envelope: [{time: 0, amplitude: 0.42}]},
      );
    });
  });

  describe('updateTutorialNotes', () => {
    it('should update the tutorial notes of a clip', () => {
      const notes = 'new-notes-1';
      store.dispatch(projectSlice.actions.updateTutorialNotes({clipId, notes}));
      expect(
        (store.getState() as RootState).project.clips[clipId].notes,
      ).toEqual(notes);
    });
  });

  describe('updateMetadata', () => {
    it('should update the project description', () => {
      const description = 'new-description';
      store.dispatch(
        projectSlice.actions.updateMetadata({metadata: {description}}),
      );
      expect((store.getState() as RootState).project.description).toEqual(
        description,
      );
    });

    it('should update the project metadata', () => {
      const description = 'new-description';
      const slug = 'new-slug';
      const category = 'new-category';
      const version = '1.0.0';
      store.dispatch(
        projectSlice.actions.updateMetadata({
          metadata: {description, slug, version},
        }),
      );
      expect((store.getState() as RootState).project.description).toEqual(
        description,
      );
      expect((store.getState() as RootState).project.slug).toEqual(slug);
      expect((store.getState() as RootState).project.version).toEqual(version);
      store.dispatch(
        projectSlice.actions.updateMetadata({metadata: {category}}),
      );
      expect((store.getState() as RootState).project.description).toEqual(
        description,
      );
      expect((store.getState() as RootState).project.slug).toEqual(slug);
      expect((store.getState() as RootState).project.category).toEqual(
        category,
      );
    });
  });

  describe('createMarker', () => {
    it('should add a new marker and sort by time', () => {
      store.dispatch(
        projectSlice.actions.createMarker({clipId, time: 1, name: 'm1'}),
      );
      expect(
        (store.getState() as RootState).project.clips[clipId].markers.length,
      ).toEqual(1);
      store.dispatch(
        projectSlice.actions.createMarker({clipId, time: 0.5, name: 'm2'}),
      );
      expect(
        (store.getState() as RootState).project.clips[clipId].markers.length,
      ).toEqual(2);
      expect(
        (store.getState() as RootState).project.clips[clipId].markers[0].name,
      ).toEqual('m2');
    });
  });

  describe('updateMarker', () => {
    it('should update the marker details', () => {
      store.dispatch(
        projectSlice.actions.createMarker({clipId, time: 0.5, name: 'm1'}),
      );
      store.dispatch(
        projectSlice.actions.createMarker({clipId, time: 1, name: 'm2'}),
      );
      const markerId = (store.getState() as RootState).project.clips[clipId]
        .markers[0].id;
      store.dispatch(
        projectSlice.actions.updateMarker({
          clipId,
          markerId,
          time: 2,
          name: 'new',
        }),
      );
      expect(
        (store.getState() as RootState).project.clips[clipId].markers[0].time,
      ).toEqual(2);
      expect(
        (store.getState() as RootState).project.clips[clipId].markers[0].name,
      ).toEqual('new');
    });
  });

  describe('updateMarkerFailure', () => {
    it('should revert the marker details', () => {
      store.dispatch(
        projectSlice.actions.createMarker({clipId, time: 0.5, name: 'm1'}),
      );
      store.dispatch(
        projectSlice.actions.createMarker({clipId, time: 1, name: 'm2'}),
      );
      const markerId = (store.getState() as RootState).project.clips[clipId]
        .markers[0].id;
      store.dispatch(
        projectSlice.actions.updateMarker({
          clipId,
          markerId,
          time: 2,
          name: 'new',
        }),
      );
      store.dispatch(
        projectSlice.actions.updateMarkerFailure({
          clipId,
          previous: [
            {id: 'm1', time: 0.5, name: 'm1'},
            {id: 'm2', time: 1, name: 'm2'},
          ],
        }),
      );
      expect(
        (store.getState() as RootState).project.clips[clipId].markers[0].time,
      ).toEqual(0.5);
      expect(
        (store.getState() as RootState).project.clips[clipId].markers[0].name,
      ).toEqual('m1');
    });
  });

  describe('deleteMarker', () => {
    it('should delete a marker', () => {
      store.dispatch(
        projectSlice.actions.createMarker({clipId, time: 0.5, name: 'm1'}),
      );
      store.dispatch(
        projectSlice.actions.createMarker({clipId, time: 1, name: 'm2'}),
      );
      const markerId = (store.getState() as RootState).project.clips[clipId]
        .markers[0].id;
      store.dispatch(projectSlice.actions.deleteMarker({clipId, markerId}));
      expect(
        (store.getState() as RootState).project.clips[clipId].markers.length,
      ).toEqual(1);
      expect(
        (store.getState() as RootState).project.clips[clipId].markers[0].name,
      ).toEqual('m2');
    });
  });

  describe('scrollTimeline', () => {
    it('should increase the duration and move the endTime by a given amount', () => {
      const delta = 0.5;
      store.dispatch(
        projectSlice.actions.scrollTimeline({
          clipId: clipId3,
          timeDelta: delta,
        }),
      );
      expect(
        (store.getState() as RootState).project.clips[clipId3].timeline
          ?.duration,
      ).toEqual(1);
      expect(
        (store.getState() as RootState).project.clips[clipId3].timeline
          ?.endTime,
      ).toEqual(1);
    });
  });

  describe('extraReducers', () => {
    describe('app.setSelectedEnvelope', () => {
      it('should empty the selected points', () => {
        store.dispatch(
          appSlice.actions.setSelectedEnvelope({
            clipId,
            envelope: EnvelopeType.Amplitude,
          }),
        );
        expect(
          (store.getState() as RootState).project.clips[clipId].state.present
            .selectedPoints,
        ).toEqual([]);
      });
    });

    describe('editingTools.enableTrim', () => {
      it('should reset the previous trim', () => {
        store.dispatch(editingToolsSlice.actions.enableTrim({duration: 1}));
        expect(
          (store.getState() as RootState).project.clips[clipId].trimAt,
        ).toEqual(undefined);
      });

      it('should set the timeline with the trim point in view', () => {
        store.dispatch(editingToolsSlice.actions.enableTrim({duration: 1}));
        expect(
          (store.getState() as RootState).project.clips[clipId].timeline
            ?.startTime,
        ).toEqual(0.65); // 0.9 - (0.5 / 2)
        expect(
          (store.getState() as RootState).project.clips[clipId].timeline
            ?.endTime,
        ).toEqual(1.15); // 0.9 + (0.5 / 2)
      });
    });
  });
});
