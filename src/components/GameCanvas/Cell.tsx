import React from 'react';
import { GameEnergyStation, GameRobot } from '../../types/gameTypes';
import { PLAYER_COLORS } from '../../helpers/playerColors';
import styles from './GameCanvas.module.scss';
import hexToPx from '../../helpers/hexToPx';

export default function Cell({
  width, height, robots, energyStations,
}: {
  width: number
  height: number
  robots: GameRobot[]
  energyStations: GameEnergyStation[]
}) {
  // 140 128
  // size = half width
  const size = 50;
  return (
    <svg
      width={100 * (5 / 6) * width}
      height={height * size * Math.sqrt(3) + size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g filter="url(#shadow_filter)">
        {Array(width).fill(undefined).map((_, x) => {
          return Array(height).fill(undefined).map((__, y) => {
            const [px, py] = hexToPx(x, y);
            return (
              <path
                // eslint-disable-next-line react/no-array-index-key
                key={`cell_${x}_${y}`}
                transform={`translate(${px}, ${py})`}
                stroke="#FF0AE6"
                strokeOpacity="0.8"
                strokeWidth="4"
                // eslint-disable-next-line max-len
                d="M93.8453 22.6987L117.691 64L93.8453 105.301L46.1547 105.301L22.3094 64L46.1547 22.6987L93.8453 22.6987Z"
              />
            );
          });
        }).flat()}
      </g>
      <g>
        {energyStations.map((energyStation) => {
          const { position: { x, y } } = energyStation;
          const [px, py] = hexToPx(x, y);
          return (
            <path
              key={`station_${x}_${y}`}
              transform={`translate(${px}, ${py})`}
              fill="#DBEB28"
              // eslint-disable-next-line max-len
              d="M93.8453 22.6987L117.691 64L93.8453 105.301L46.1547 105.301L22.3094 64L46.1547 22.6987L93.8453 22.6987Z"
            />
          );
        })}
      </g>
      <g>
        {robots.map((robot) => {
          const { position: { x, y }, owner } = robot;
          const color = PLAYER_COLORS[owner];
          const [px, py] = hexToPx(x, y);
          return (
            <path
              key={`robot_${x}_${y}`}
              className={styles.robot}
              style={{ '--x': `${px}px`, '--y': `${py}px` }}
              fill={color}
              // eslint-disable-next-line max-len
              d="M93.8453 22.6987L117.691 64L93.8453 105.301L46.1547 105.301L22.3094 64L46.1547 22.6987L93.8453 22.6987Z"
            />
          );
        })}
      </g>
      <defs>
        <filter id="shadow_filter" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset />
          <feGaussianBlur stdDeviation="6" />
          <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.0392157 0 0 0 0 0.901961 0 0 0 0.5 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="shadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="shadow" result="shape" />
        </filter>
      </defs>
    </svg>
  );
}