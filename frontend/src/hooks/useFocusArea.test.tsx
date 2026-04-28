/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {render, cleanup} from '../test-utils';
import {useFocusArea, useFocusAreaCallback} from './useFocusArea';
import {FocusArea} from '../state/types';
import actions from '../state/actions';

afterEach(cleanup);

const dispatchMock = jest.fn();

jest.mock('react-redux', () => ({
  ...(jest.requireActual('react-redux') as typeof import('react-redux')),
  useDispatch: () => dispatchMock,
}));

interface TestComponentProps {
  targetArea: FocusArea;
  onRender: (result: ReturnType<typeof useFocusArea>) => void;
}

const TestComponent = ({targetArea, onRender}: TestComponentProps) => {
  const result = useFocusArea(targetArea);
  onRender(result);
  return <div data-testid="test-component" onClick={result.setFocus} />;
};

interface TestCallbackComponentProps {
  targetArea: FocusArea;
  onRender: (callback: ReturnType<typeof useFocusAreaCallback>) => void;
}

const TestCallbackComponent = ({
  targetArea,
  onRender,
}: TestCallbackComponentProps) => {
  const callback = useFocusAreaCallback(targetArea);
  onRender(callback);
  return <div data-testid="test-callback-component" onClick={callback} />;
};

describe('useFocusArea', () => {
  afterEach(() => {
    dispatchMock.mockClear();
  });

  it('should return current focus state', () => {
    let hookResult: ReturnType<typeof useFocusArea> | undefined;

    render(
      <TestComponent
        targetArea={FocusArea.Navigator}
        onRender={result => {
          hookResult = result;
        }}
      />,
      {
        selectors: {
          app: {
            getFocus: () => FocusArea.Navigator,
          },
        },
      },
    );

    expect(hookResult?.focus).toBe(FocusArea.Navigator);
    expect(hookResult?.isFocused).toBe(true);
  });

  it('should return isFocused false when target is not the current focus', () => {
    let hookResult: ReturnType<typeof useFocusArea> | undefined;

    render(
      <TestComponent
        targetArea={FocusArea.Plot}
        onRender={result => {
          hookResult = result;
        }}
      />,
      {
        selectors: {
          app: {
            getFocus: () => FocusArea.Navigator,
          },
        },
      },
    );

    expect(hookResult?.focus).toBe(FocusArea.Navigator);
    expect(hookResult?.isFocused).toBe(false);
  });

  it('should dispatch setFocusArea when focus is different from target', () => {
    const element = render(
      <TestComponent targetArea={FocusArea.Plot} onRender={() => {}} />,
      {
        selectors: {
          app: {
            getFocus: () => FocusArea.Navigator,
          },
        },
      },
    );

    element.getByTestId('test-component').click();

    expect(dispatchMock).toHaveBeenCalledWith(
      actions.app.setFocusArea({focus: FocusArea.Plot}),
    );
  });

  it('should not dispatch setFocusArea when already focused on target', () => {
    const element = render(
      <TestComponent targetArea={FocusArea.Plot} onRender={() => {}} />,
      {
        selectors: {
          app: {
            getFocus: () => FocusArea.Plot,
          },
        },
      },
    );

    element.getByTestId('test-component').click();

    expect(dispatchMock).not.toHaveBeenCalled();
  });
});

describe('useFocusAreaCallback', () => {
  afterEach(() => {
    dispatchMock.mockClear();
  });

  it('should dispatch setFocusArea when focus is different from target', () => {
    const element = render(
      <TestCallbackComponent
        targetArea={FocusArea.RightPanel}
        onRender={() => {}}
      />,
      {
        selectors: {
          app: {
            getFocus: () => FocusArea.Navigator,
          },
        },
      },
    );

    element.getByTestId('test-callback-component').click();

    expect(dispatchMock).toHaveBeenCalledWith(
      actions.app.setFocusArea({focus: FocusArea.RightPanel}),
    );
  });

  it('should not dispatch setFocusArea when already focused on target', () => {
    const element = render(
      <TestCallbackComponent
        targetArea={FocusArea.RightPanel}
        onRender={() => {}}
      />,
      {
        selectors: {
          app: {
            getFocus: () => FocusArea.RightPanel,
          },
        },
      },
    );

    element.getByTestId('test-callback-component').click();

    expect(dispatchMock).not.toHaveBeenCalled();
  });
});
