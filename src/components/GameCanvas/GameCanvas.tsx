import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from '@pronestor/react-zoom-pan-pinch';
import React, {
  useCallback, useEffect, useMemo, useRef,
} from 'react';
import deepClone from 'deep-clone';
import {
  GameConfig, GameMap, GamePlayerActions, GamePosition,
} from '../../types/gameTypes';

import styles from './GameCanvas.module.scss';
import SvgMap from '../SvgMap/SvgMap';
import hexToPx from '../../helpers/hexToPx';
import { evenqDistance } from '../../helpers/hexUtils';
import delay from '../../helpers/delay';

interface OwnProps {
  isPaused: boolean;
  startingMap: GameMap;
  gameConfig: GameConfig;
  previousActions: GamePlayerActions[];
  currentPlayerAction: GamePlayerActions | undefined;
  onAnimationEnd: VoidFunction;
}

export default function GameCanvas({
  isPaused,
  startingMap,
  gameConfig,
  previousActions,
  currentPlayerAction,
  onAnimationEnd,
}: OwnProps) {
  const transformWrapperRef = useRef<ReactZoomPanPinchRef>(null);
  const [isUpdated, setIsUpdated] = React.useState(false);
  const [selectedPath, setSelectedPath] = React.useState<GamePosition[]>([]);
  const [collectingEnergyFrom, setCollectingEnergyFrom] = React.useState<GamePosition[]>([]);
  const [collectingEnergyTo, setCollectingEnergyTo] = React.useState<GamePosition | undefined>();

  const calculateMap = useCallback((shouldIncludeCurrent = false) => {
    return (shouldIncludeCurrent
      ? [...previousActions, currentPlayerAction!].filter(Boolean)
      : previousActions).reduce((acc, action) => {
      if (action.type === 'move') {
        acc.robots[action.robotId].position = action.newPosition;
        acc.robots[action.robotId].energy -= action.loss;
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
  }, [
    currentPlayerAction,
    gameConfig.energyCollectDistance,
    gameConfig.energyLossToCloneRobot,
    previousActions,
    startingMap,
  ]);

  const currentTimeoutRef = useRef<NodeJS.Timeout>();

  function clearTimeouts() {
    if (currentTimeoutRef.current) {
      clearTimeout(currentTimeoutRef.current);
    }
  }

  const timeout = useCallback((fn: VoidFunction, ms: number) => {
    clearTimeouts();

    let resolver: VoidFunction;
    const promise = new Promise<void>((resolve) => {
      resolver = resolve;
    });

    currentTimeoutRef.current = setTimeout(() => {
      fn();
      resolver();
      currentTimeoutRef.current = undefined;
    }, ms);

    return promise;
  }, []);

  useEffect(() => {
    if (isPaused) {
      setIsUpdated(true);
      clearTimeouts();
    }
  }, [isPaused]);

  const map = useMemo(() => {
    return calculateMap(isUpdated);
  }, [calculateMap, isUpdated]);

  function moveCamera(x: number, y: number, animationType: 'linear' | 'easeOut' = 'linear'): Promise<void> {
    if (!transformWrapperRef.current) return Promise.resolve();
    const { clientWidth, clientHeight } = transformWrapperRef.current.instance.wrapperComponent!;
    const [px, py] = hexToPx(x, y);

    transformWrapperRef.current!.setTransform(
      -px + clientWidth / 2 - 50,
      -py + clientHeight / 2 - 50,
      1,
      500,
      animationType,
    );

    return delay(500);
  }

  const reset = useCallback(() => {
    setCollectingEnergyFrom([]);
    setCollectingEnergyTo(undefined);
    setSelectedPath([]);
  }, []);

  useEffect(() => {
    if (!transformWrapperRef.current) return;
    setIsUpdated(false);
    const mapCurrent = calculateMap();

    switch (currentPlayerAction?.type) {
      case 'move': {
        const currentRobot = mapCurrent.robots[currentPlayerAction.robotId];
        const { x, y } = currentRobot.position;

        moveCamera(x, y, 'easeOut');

        timeout(() => {
          const { x: xNew, y: yNew } = currentPlayerAction.newPosition;

          setIsUpdated(true);

          moveCamera(xNew, yNew).then(() => {
            timeout(onAnimationEnd, 500);
          });
        }, 1000);
        break;
      }
      case 'moveFailed': {
        const currentRobot = mapCurrent.robots[currentPlayerAction.robotId];

        const { x, y } = currentRobot.position;
        moveCamera(x, y, 'easeOut');

        timeout(() => {
          setSelectedPath([currentPlayerAction.newPosition]);
          moveCamera(currentPlayerAction.newPosition.x, currentPlayerAction.newPosition.y);

          timeout(() => {
            reset();
            setIsUpdated(true);
            timeout(onAnimationEnd, 500);
          }, 1000);
        }, 1000);
        break;
      }
      case 'collectEnergyFailed': {
        const { x, y } = mapCurrent.robots[currentPlayerAction.robotId].position;

        moveCamera(x, y, 'easeOut');

        timeout(() => {
          const d = [];
          for (let dx = -gameConfig.energyCollectDistance; dx <= gameConfig.energyCollectDistance; dx++) {
            for (let dy = -gameConfig.energyCollectDistance; dy <= gameConfig.energyCollectDistance; dy++) {
              if (evenqDistance({ x, y }, { x: x + dx, y: y + dy }) <= gameConfig.energyCollectDistance) {
                d.push({ x: x + dx, y: y + dy });
              }
            }
          }

          setSelectedPath(d);
          timeout(() => {
            reset();
            setIsUpdated(true);
            timeout(onAnimationEnd, 500);
          }, 1000);
        }, 1000);
        break;
      }
      case 'collectEnergy': {
        const { x, y } = mapCurrent.robots[currentPlayerAction.robotId].position;

        moveCamera(x, y, 'easeOut');

        timeout(() => {
          const d = [];
          for (let dx = -gameConfig.energyCollectDistance; dx <= gameConfig.energyCollectDistance; dx++) {
            for (let dy = -gameConfig.energyCollectDistance; dy <= gameConfig.energyCollectDistance; dy++) {
              if (evenqDistance({ x, y }, { x: x + dx, y: y + dy }) <= gameConfig.energyCollectDistance) {
                if (
                  mapCurrent.energyStations.find((e) => e.energy > 0
                      && e.position.x === x + dx && e.position.y === y + dy)) {
                  d.push({ x: x + dx, y: y + dy });
                }
              }
            }
          }
          setCollectingEnergyFrom(d);
          setCollectingEnergyTo({ x, y });
          setIsUpdated(true);
          timeout(onAnimationEnd, 1000).then(reset);
        }, 1000);

        break;
      }

      case 'timeout': {
        const { x, y } = mapCurrent.robots[currentPlayerAction.robotId].position;

        moveCamera(x, y, 'easeOut').then(() => {
          timeout(() => {
            setIsUpdated(true);
            onAnimationEnd();
          }, 1000);
        });
      }
    }
  }, [gameConfig, currentPlayerAction, calculateMap, timeout, onAnimationEnd, reset]);

  useEffect(() => {
    reset();
  }, [isPaused, reset]);

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
