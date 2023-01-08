import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from '@pronestor/react-zoom-pan-pinch';
import React, { useEffect, useMemo, useRef } from 'react';
import deepClone from 'deep-clone';
import {
  GameConfig, GameMap, GamePlayerActions, GamePosition,
} from '../../types/gameTypes';

import styles from './GameCanvas.module.scss';
import SvgMap from '../SvgMap/SvgMap';
import hexToPx from '../../helpers/hexToPx';
import { evenqDistance } from '../../helpers/hexUtils';

interface OwnProps {
  startingMap: GameMap;
  gameConfig: GameConfig;
  previousActions: GamePlayerActions[];
  currentPlayerAction: GamePlayerActions | undefined;
}

export default function GameCanvas({
  startingMap,
  gameConfig,
  previousActions,
  currentPlayerAction,
}: OwnProps) {
  const transformWrapperRef = useRef<ReactZoomPanPinchRef>(null);
  const [isUpdated, setIsUpdated] = React.useState(false);
  const [selectedPath, setSelectedPath] = React.useState<GamePosition[]>([]);
  const [collectingEnergyFrom, setCollectingEnergyFrom] = React.useState<GamePosition[]>([]);
  const [collectingEnergyTo, setCollectingEnergyTo] = React.useState<GamePosition | undefined>();

  const map = useMemo(() => {
    return (isUpdated
      ? [...previousActions, currentPlayerAction!].filter(Boolean)
      : previousActions).reduce((acc, action) => {
      if (action.type === 'move') {
        acc.robots[action.robotId].position = action.newPosition;
      } else if (action.type === 'collectEnergy') {
        const position = acc.robots[action.robotId].position;
        acc.energyStations.forEach((station, index) => {
          if (evenqDistance(station.position, position) <= gameConfig.energyCollectDistance) {
            acc.robots[action.robotId].energy += station.energy;
            acc.energyStations[index].energy = 0;
          }
        });
      } else if (action.type === 'cloneRobot') {
        acc.robots[action.robotId].energy -= gameConfig.energyLossToCloneRobot + action.newRobot.energy;
        acc.robots.push(action.newRobot);
      }
      return acc;
    }, deepClone(startingMap));
  }, [previousActions, currentPlayerAction, isUpdated]);

  function moveCamera(x: number, y: number, animationType: 'linear' | 'easeOut' = 'linear') {
    if (!transformWrapperRef.current) return;
    const { clientWidth, clientHeight } = transformWrapperRef.current.instance.wrapperComponent!;
    const [px, py] = hexToPx(x, y);

    transformWrapperRef.current!.setTransform(
      -px + clientWidth / 2 - 50,
      -py + clientHeight / 2 - 50,
      1,
      500,
      animationType,
    );
  }

  useEffect(() => {
    if (!transformWrapperRef.current) return;
    setIsUpdated(false);

    switch (currentPlayerAction?.type) {
      case 'move': {
        const currentRobot = startingMap.robots[currentPlayerAction.robotId];
        const { x, y } = currentRobot.position;

        moveCamera(x, y, 'easeOut');

        setTimeout(() => {
          const { x: xNew, y: yNew } = currentPlayerAction.newPosition;

          setIsUpdated(true);

          moveCamera(xNew, yNew);
        }, 1000);
        break;
      }
      case 'moveFailed': {
        const currentRobot = startingMap.robots[currentPlayerAction.robotId];

        const { x, y } = currentRobot.position;
        moveCamera(x, y, 'easeOut');

        setTimeout(() => {
          setSelectedPath([currentPlayerAction.newPosition]);
          moveCamera(currentPlayerAction.newPosition.x, currentPlayerAction.newPosition.y);

          setTimeout(() => {
            setSelectedPath([]);
            setIsUpdated(true);
          }, 1000);
        }, 1000);
        break;
      }
      case 'collectEnergyFailed': {
        const { x, y } = startingMap.robots[currentPlayerAction.robotId].position;

        moveCamera(x, y, 'easeOut');

        setTimeout(() => {
          const d = [];
          for (let dx = -gameConfig.energyCollectDistance; dx <= gameConfig.energyCollectDistance; dx++) {
            for (let dy = -gameConfig.energyCollectDistance; dy <= gameConfig.energyCollectDistance; dy++) {
              if (evenqDistance({ x, y }, { x: x + dx, y: y + dy }) <= gameConfig.energyCollectDistance) {
                d.push({ x: x + dx, y: y + dy });
              }
            }
          }

          setSelectedPath(d);
          setTimeout(() => {
            setSelectedPath([]);
            setIsUpdated(true);
          }, 1000);
        }, 1000);
        break;
      }
      case 'collectEnergy': {
        const { x, y } = startingMap.robots[currentPlayerAction.robotId].position;

        moveCamera(x, y, 'easeOut');

        setTimeout(() => {
          const d = [];
          for (let dx = -gameConfig.energyCollectDistance; dx <= gameConfig.energyCollectDistance; dx++) {
            for (let dy = -gameConfig.energyCollectDistance; dy <= gameConfig.energyCollectDistance; dy++) {
              if (evenqDistance({ x, y }, { x: x + dx, y: y + dy }) <= gameConfig.energyCollectDistance) {
                if (map.energyStations.find((e) => e.position.x === x + dx && e.position.y === y + dy)) {
                  d.push({ x: x + dx, y: y + dy });
                }
              }
            }
          }
          setCollectingEnergyFrom(d);
          setCollectingEnergyTo({ x, y });
          setIsUpdated(true);
          // moveCamera(x + gameConfig.energyCollectDistance, y);
          // setTimeout(() => {
          // }, 1000);
        }, 1000);

        break;
      }
    }
    // const bot = map.robots.find((_, i) => i === diff);
    // if ((bot == null) || (transformWrapperRef.current == null)) return;
    //
    // const { position: { x, y } } = bot;
    // const [px, py] = hexToPx(x, y);
    //
    // const { clientWidth, clientHeight } = transformWrapperRef.current.instance.wrapperComponent!;
    // transformWrapperRef.current?.setTransform(
    //   -px + clientWidth / 2,
    //   -py + clientHeight / 2,
    //   1,
    //   400,
    //   'easeOut',
    // );
  }, [gameConfig, currentPlayerAction]);

  return (
    <TransformWrapper
      // onZoom={handleZoom}
      doubleClick={{ disabled: true }}
      limitToBounds
      // maxScale={scale}
      minScale={0.1}
      // initialScale={minScale}
      ref={transformWrapperRef}
    >
      <TransformComponent wrapperClass={styles.wrapper}>
        <SvgMap
          width={gameConfig.width}
          height={gameConfig.height}
          selectedPath={selectedPath}
          collectingEnergyFrom={collectingEnergyFrom}
          collectingEnergyTo={collectingEnergyTo}
          robots={map.robots}
          energyStations={map.energyStations}
        />
      </TransformComponent>
    </TransformWrapper>
  );
}
