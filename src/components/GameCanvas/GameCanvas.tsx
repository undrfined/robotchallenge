import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from '@pronestor/react-zoom-pan-pinch';
import React, { useEffect, useMemo, useRef } from 'react';
import deepClone from 'deep-clone';
import {
  GameConfig, GameMap, GamePlayerActions, GamePosition,
} from '../../types/gameTypes';

import styles from './GameCanvas.module.scss';
import SvgMap from '../SvgMap/SvgMap';
import hexToPx from '../../helpers/hexToPx';

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

  const map = useMemo(() => {
    return (isUpdated
      ? [...previousActions, currentPlayerAction!].filter(Boolean)
      : previousActions).reduce((acc, action) => {
      if (action.type === 'move') {
        acc.robots[action.robotId].position = action.newPosition;
      }
      if (action.type === 'collectEnergyFailed') {
        acc.robots[action.robotId].energy -= 100;
      }
      return acc;
    }, deepClone(startingMap));
  }, [previousActions, currentPlayerAction, isUpdated]);

  function moveCamera(x: number, y: number) {
    if (!transformWrapperRef.current) return;
    const { clientWidth, clientHeight } = transformWrapperRef.current.instance.wrapperComponent!;
    const [px, py] = hexToPx(x, y);

    transformWrapperRef.current!.setTransform(
      -px + clientWidth / 2 - 50,
      -py + clientHeight / 2 - 50,
      1,
      500,
      'linear',
    );
  }

  useEffect(() => {
    if (!transformWrapperRef.current) return;
    setIsUpdated(false);

    if (currentPlayerAction?.type === 'move') {
      const currentRobot = startingMap.robots[currentPlayerAction.robotId];
      const { x, y } = currentRobot.position;

      moveCamera(x, y);

      setTimeout(() => {
        const { x: xNew, y: yNew } = currentPlayerAction.newPosition;

        setIsUpdated(true);

        moveCamera(xNew, yNew);
      }, 1000);
    } else if (currentPlayerAction?.type === 'collectEnergyFailed') {
      const { x, y } = startingMap.robots[currentPlayerAction.robotId].position;

      moveCamera(x, y);

      setTimeout(() => {
        setSelectedPath([{ x, y }, { x: x + 1, y }, { x: x + 2, y }, { x: x + 3, y }, { x: x + 4, y }]);
        setTimeout(() => {
          setSelectedPath([]);
          setIsUpdated(true);
        }, 1000);
      }, 1000);
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
  }, [currentPlayerAction]);

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
          robots={map.robots}
          energyStations={map.energyStations}
        />
      </TransformComponent>
    </TransformWrapper>
  );
}
