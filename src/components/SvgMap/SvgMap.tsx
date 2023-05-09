import React from 'react';
import cn from 'classnames';
import type { GameEnergyStation, GamePosition, GameRobot } from '../../types/gameTypes';
import { PLAYER_COLORS } from '../../helpers/playerColors';
import styles from './SvgMap.module.scss';
import { axialToPixel } from '../../helpers/hexToPx';
import Icon from '../common/Icon/Icon';

type OwnProps = {
  width: number;
  robots: GameRobot[];
  selectedPath: GamePosition[];
  collectingEnergyFrom: GamePosition[];
  collectingEnergyTo: GamePosition | undefined;
  energyStations: GameEnergyStation[];
};

export default function SvgMap({
  width, robots, energyStations, selectedPath, collectingEnergyFrom, collectingEnergyTo,
}: OwnProps) {
  // 140 128
  // size = half width
  const size = 50;
  const s = width;
  const totalWidth = ((3 / 2) * size) * s * 2;
  const totalHeight = Math.sqrt(3) * size * s * 2;

  return (
    <svg
      width={totalWidth}
      height={totalHeight}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g filter="url(#shadow_filter)">
        {(() => {
          const a = [];
          for (let q = -s + 1; q < s; q++) {
            const r1 = Math.max(-s, -q - s);
            const r2 = Math.min(s, -q + s);

            for (let r = r1 + 1; r < r2; r++) {
              const [px, py] = axialToPixel({ q, r }, width);

              const isSelected = selectedPath.find((pos) => pos.q === q && pos.r === r);

              const o = (
                <path
                  // eslint-disable-next-line react/no-array-index-key
                  key={`cell_${q}_${r}`}
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

              a.push(o);
            }
          }
          return a;
        })()}
      </g>
      <g>
        {energyStations.map((energyStation) => {
          const { position } = energyStation;
          const [px, py] = axialToPixel(position, width);
          // TODO center energy station text somehow
          return (
            <g
              key={`station_${position.q}_${position.r}`}
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
              <Icon
                name="EnergyIcon"
                width="48"
                height="48"
                x="46"
                y="40"
                style={{ color: 'black' }}
                transform="scale(5)"
              />
              <text className={styles.energyText} x="52" y="42">{energyStation.energy}</text>
            </g>
          );
        })}
      </g>
      <g>
        {robots.map((robot, i) => {
          const { position, owner } = robot;
          const [px, py] = axialToPixel(position, width);

          const color = PLAYER_COLORS[owner];
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
        {collectingEnergyTo && collectingEnergyFrom.map((position) => {
          const [px, py] = axialToPixel(position, width);
          const [toPx, toPy] = axialToPixel(collectingEnergyTo, width);
          return (
            <g
              key={`collect_${position.q}_${position.r}`}
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
                <Icon
                  name="EnergyIcon"
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
