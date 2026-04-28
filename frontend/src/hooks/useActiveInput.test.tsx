/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import userEvent from '@testing-library/user-event';

import {render, cleanup} from '../test-utils';
import useActiveInput from './useActiveInput';

afterEach(cleanup);

const TestComponent = (props: {onFocus: () => void; onBlur: () => void}) => {
  const [isEditing, setIsEditing] = React.useState(false);

  useActiveInput(props.onFocus, props.onBlur);

  return (
    <div>
      {isEditing ? (
        <input type="text" autoFocus />
      ) : (
        <button type="button" onClick={() => setIsEditing(true)}>
          Edit
        </button>
      )}
    </div>
  );
};

describe('useActiveInput', () => {
  it('should call the onFocus and onBlur callbacks', async () => {
    const user = userEvent.setup();

    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const element = render(
      <TestComponent onFocus={onFocus} onBlur={onBlur} />,
      {},
    );
    element.getByText('Edit').click();
    expect(onFocus).toHaveBeenCalled();
    await user.tab();
    expect(onBlur).toHaveBeenCalled();
  });
});
