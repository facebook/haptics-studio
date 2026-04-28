/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useEffect} from 'react';
import {Group} from 'react-konva';

interface Props {
  type: string;
  enabled?: boolean;
  children: any;
}

/**
 * Enables canvas items to change the mouse pointer
 */
function HoverCursor(props: Props) {
  const {type, enabled} = props;

  useEffect(() => {
    return () => {
      document.body.style.cursor = 'default';
    };
  }, []);

  return (
    <Group
      onMouseEnter={() => {
        if (enabled) {
          document.body.style.cursor = type;
        }
      }}
      onMouseLeave={() => {
        if (enabled) {
          document.body.style.cursor = 'default';
        }
      }}>
      {props.children}
    </Group>
  );
}

HoverCursor.defaultProps = {
  enabled: true,
};

export default React.memo(HoverCursor);
