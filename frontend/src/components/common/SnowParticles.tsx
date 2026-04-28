/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {createAppStyle} from '../../styles/theme.style';
import {ZIndex} from '../../styles/zIndex';

const useStyles = createAppStyle({
  snowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: ZIndex.Toolbar,
    maskImage:
      'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 66%, rgba(0,0,0,0) 100%)',
    WebkitMaskImage:
      'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 66%, rgba(0,0,0,0) 100%)',
  },
  snowflake: {
    position: 'absolute',
    color: '#fff',
    fontSize: '1em',
    fontFamily: 'Arial, sans-serif',
    textShadow: '0 0 5px #000',
    animation: '$fall linear infinite',
    opacity: 0.8,
  },
  '@keyframes fall': {
    '0%': {
      transform: 'translateY(0vh) rotate(0deg)',
      opacity: 0.8,
    },
    '100%': {
      transform: 'translateY(105vh) rotate(360deg)',
      opacity: 0.3,
    },
  },
});

interface Snowflake {
  id: number;
  left: string;
  animationDuration: string;
  animationDelay: string;
  fontSize: string;
  opacity: number;
  startY: string;
}

function SnowParticles() {
  const classes = useStyles();
  const [snowflakes, setSnowflakes] = React.useState<Snowflake[]>([]);

  // Show snow from December 1 through January 6
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();
  const isInSnowSeason =
    (month === 11 && day >= 1) || (month === 0 && day <= 6);

  React.useEffect(() => {
    // Generate snowflakes with random properties
    const flakes: Snowflake[] = [];
    const flakeCount = 50;

    for (let i = 0; i < flakeCount; i++) {
      flakes.push({
        id: i,
        left: `${Math.random() * 100}%`,
        animationDuration: `${10 + Math.random() * 15}s`,
        animationDelay: `${Math.random() * 8}s`,
        fontSize: `${0.5 + Math.random() * 1}em`,
        opacity: 0.5 + Math.random() * 0.3,
        startY: `${-Math.random() * 100}vh`,
      });
    }

    setSnowflakes(flakes);
  }, []);

  if (!isInSnowSeason || process.env.NODE_ENV === 'test') {
    // Disable snowflakes during e2e tests and outside of the snow season
    return null;
  }

  return (
    <div className={classes.snowContainer}>
      {snowflakes.map(flake => (
        <div
          key={flake.id}
          className={classes.snowflake}
          style={{
            left: flake.left,
            top: flake.startY,
            animationDuration: flake.animationDuration,
            animationDelay: flake.animationDelay,
            fontSize: flake.fontSize,
            opacity: flake.opacity,
          }}>
          ❄
        </div>
      ))}
    </div>
  );
}

export default React.memo(SnowParticles);
