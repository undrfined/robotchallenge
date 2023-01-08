import React from 'react';
import cn from 'classnames';
import { GameEnergyStation, GamePosition, GameRobot } from '../../types/gameTypes';
import { PLAYER_COLORS } from '../../helpers/playerColors';
import styles from './SvgMap.module.scss';
import hexToPx from '../../helpers/hexToPx';
import Energy from '../../assets/icons/EnergyIcon.svg';

export default function SvgMap({
  width, height, robots, energyStations, selectedPath, collectingEnergyFrom, collectingEnergyTo,
}: {
  width: number;
  height: number;
  robots: GameRobot[];
  selectedPath: GamePosition[];
  collectingEnergyFrom: GamePosition[];
  collectingEnergyTo: GamePosition | undefined;
  energyStations: GameEnergyStation[];
}) {
  // 140 128
  // size = half width
  const size = 50;
  return (
    <svg
      width={100 * (5 / 6) * width}
      height={height * size * Math.sqrt(3) + size * 4}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g filter="url(#shadow_filter)">
        {Array(width).fill(undefined).map((_, x) => {
          return Array(height).fill(undefined).map((__, y) => {
            const [px, py] = hexToPx(x, y);

            const isSelected = selectedPath.find((pos) => pos.x === x && pos.y === y);

            return (
              <path
                // eslint-disable-next-line react/no-array-index-key
                key={`cell_${x}_${y}`}
                transform={`translate(${px}, ${py})`}
                stroke="#FF0AE6"
                className={isSelected ? styles.selectedCell : undefined}
                strokeOpacity={0.8}
                style={{ '--x': `${px}px`, '--y': `${py}px` }}
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
          // TODO center energy station text somehow
          return (
            <g
              key={`station_${x}_${y}`}
              transform={`translate(${px}, ${py})`}
              className={cn(
                styles.energyStation,
                energyStation.energy === 0 && styles.emptyEnergyStation,
              )}
            >
              <path
                fill="#DBEB28"
                // eslint-disable-next-line max-len
                d="M93.8453 22.6987L117.691 64L93.8453 105.301L46.1547 105.301L22.3094 64L46.1547 22.6987L93.8453 22.6987Z"
              />
              <Energy width="48" height="48" x="46" y="40" style={{ color: 'black' }} transform="scale(5)" />
              <text className={styles.energyText} x="52" y="42">{energyStation.energy}</text>
            </g>
          );
        })}
      </g>
      <g>
        {robots.map((robot, i) => {
          const { position: { x, y }, owner } = robot;
          const color = PLAYER_COLORS[owner];
          const [px, py] = hexToPx(x, y);
          return (
            <g
              // eslint-disable-next-line react/no-array-index-key
              key={`robot_${i}`}
              style={{ '--x': `${px}px`, '--y': `${py}px` }}
              className={styles.robot}
            >
              <path
                fill={color}
                // eslint-disable-next-line max-len
                d="M93.8453 22.6987L117.691 64L93.8453 105.301L46.1547 105.301L22.3094 64L46.1547 22.6987L93.8453 22.6987Z"
              />
              <text className={styles.robotText} x="52" y="42">{robot.energy}</text>
            </g>
          );
        })}
      </g>
      <g>
        {collectingEnergyTo && collectingEnergyFrom.map(({ x, y }) => {
          const [px, py] = hexToPx(x, y);
          const [toPx, toPy] = hexToPx(collectingEnergyTo.x, collectingEnergyTo.y);
          return (
            <g
              key={`collect_${x}_${y}`}
              transform={`translate(${px}, ${py})`}
            >
              {/* <path */}
              {/*  fill="#DBEB28" */}
              {/*  // eslint-disable-next-line max-len */}
              {/*  d="M93.8453 22.6987L117.691 64L93.8453 105.301L46.1547 105.301L22.3094 64L46.1547 22.6987L93.8453 22.6987Z" */}
              {/* /> */}
              <g
                style={{ '--to-x': `${toPx - px}px`, '--to-y': `${toPy - py}px` }}
                className={styles.collectingEnergy}
              >
                <Energy
                  width="48"
                  height="48"
                  x="46"
                  y="40"
                  style={{ color: 'black' }}
                />
              </g>
              {/* <text className={styles.energyText} x="52" y="42">{energyStation.energy}</text> */}
            </g>
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
