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
import { axialToPixel } from '../../helpers/hexToPx';
import delay from '../../helpers/delay';
import { axialAdd, axialDistance } from '../../helpers/hexUtils';

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
        acc.robots[action.robotId] = {
          ...acc.robots[action.robotId],
          position: action.newPosition,
        };

        acc.robots[action.robotId] = {
          ...acc.robots[action.robotId],
          energy: acc.robots[action.robotId].energy - action.loss,
        };
      } else if (action.type === 'collectEnergy') {
        const position = acc.robots[action.robotId].position;
        acc.energyStations.forEach((station, index) => {
          if (axialDistance(station.position, position) <= gameConfig.energyCollectDistance) {
            acc.robots[action.robotId] = {
              ...acc.robots[action.robotId],
              energy: acc.robots[action.robotId].energy + station.energy,
            };
            acc.energyStations[index] = {
              ...station,
              energy: 0,
            };
          }
        });
      } else if (action.type === 'cloneRobot') {
        acc.robots[action.robotId] = {
          ...acc.robots[action.robotId],
          energy: acc.robots[action.robotId].energy - (gameConfig.energyLossToCloneRobot + action.newRobot.energy),
        };
        acc.robots = [...acc.robots, action.newRobot];
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

  function moveCamera(position: GamePosition, animationType: 'linear' | 'easeOut' = 'linear'): Promise<void> {
    if (!transformWrapperRef.current) return Promise.resolve();
    const { clientWidth, clientHeight } = transformWrapperRef.current.instance.wrapperComponent!;
    const [px, py] = axialToPixel(position);

    transformWrapperRef.current!.setTransform(
      -px + clientWidth / 2 - 50,
      -py + clientHeight / 2 - 50,
      1,
      500,
      animationType,
    );

    return delay(500);
  }

  const hasTransformWrapper = !!transformWrapperRef.current;

  useEffect(() => {
    if (!transformWrapperRef.current) return;

    transformWrapperRef.current.centerView(0.1, 0);
  }, [hasTransformWrapper]);

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
        const position = currentRobot.position;

        moveCamera(position, 'easeOut');

        timeout(() => {
          const newPosition = currentPlayerAction.newPosition;

          setIsUpdated(true);

          moveCamera(newPosition).then(() => {
            timeout(onAnimationEnd, 500);
          });
        }, 1000);
        break;
      }
      case 'moveFailed': {
        const currentRobot = mapCurrent.robots[currentPlayerAction.robotId];

        const position = currentRobot.position;
        moveCamera(position, 'easeOut');

        timeout(() => {
          setSelectedPath([currentPlayerAction.newPosition]);
          moveCamera(currentPlayerAction.newPosition);

          timeout(() => {
            reset();
            setIsUpdated(true);
            timeout(onAnimationEnd, 500);
          }, 1000);
        }, 1000);
        break;
      }
      case 'collectEnergyFailed': {
        const position = mapCurrent.robots[currentPlayerAction.robotId].position;

        moveCamera(position, 'easeOut');

        timeout(() => {
          const d = [];
          for (let dx = -gameConfig.energyCollectDistance; dx <= gameConfig.energyCollectDistance; dx++) {
            for (let dy = -gameConfig.energyCollectDistance; dy <= gameConfig.energyCollectDistance; dy++) {
              const f = axialAdd(position, { q: dx, r: dy });
              if (axialDistance(position, f) <= gameConfig.energyCollectDistance) {
                d.push(f);
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
        const position = mapCurrent.robots[currentPlayerAction.robotId].position;

        moveCamera(position, 'easeOut');

        timeout(() => {
          const d = [];
          for (let dx = -gameConfig.energyCollectDistance; dx <= gameConfig.energyCollectDistance; dx++) {
            for (let dy = -gameConfig.energyCollectDistance; dy <= gameConfig.energyCollectDistance; dy++) {
              const f = axialAdd(position, { q: dx, r: dy });
              if (axialDistance(position, f) <= gameConfig.energyCollectDistance) {
                if (
                  mapCurrent.energyStations.find((e) => e.energy > 0
                      && e.position.q === f.q && e.position.r === f.r)) {
                  d.push(f);
                }
              }
            }
          }
          setCollectingEnergyFrom(d);
          setCollectingEnergyTo(position);
          setIsUpdated(true);
          timeout(onAnimationEnd, 1000).then(reset);
        }, 1000);

        break;
      }

      case 'cloneRobot': {
        const position = mapCurrent.robots[currentPlayerAction.robotId].position;

        moveCamera(position, 'easeOut').then(() => {
          timeout(() => {
            setIsUpdated(true);

            timeout(() => {
              onAnimationEnd();
              reset();
            }, 1000);
          }, 500);
        });
        break;
      }

      case 'cloneRobotFailed': {
        const position = mapCurrent.robots[currentPlayerAction.robotId].position;

        moveCamera(position, 'easeOut').then(() => {
          timeout(() => {
            setIsUpdated(true);
            onAnimationEnd();
            reset();
          }, 1000);
        });
        break;
      }

      case 'timeout': {
        const position = mapCurrent.robots[currentPlayerAction.robotId].position;

        moveCamera(position, 'easeOut').then(() => {
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
