import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from '@pronestor/react-zoom-pan-pinch';
import React, { useEffect, useRef } from 'react';
import { GameConfig, GameMap } from '../../types/gameTypes';

import styles from './GameCanvas.module.scss';
import hexToPx from '../../helpers/hexToPx';
import SvgMap from '../SvgMap/SvgMap';

interface OwnProps {
  map: GameMap
  gameConfig: GameConfig
  diff: number
}

export default function GameCanvas({
  map,
  gameConfig,
  diff,
}: OwnProps) {
  const transformWrapperRef = useRef<ReactZoomPanPinchRef>(null);

  useEffect(() => {
    const bot = map.robots.find((_, i) => i === diff);
    if ((bot == null) || (transformWrapperRef.current == null)) return;

    const { position: { x, y } } = bot;
    const [px, py] = hexToPx(x, y);

    const { clientWidth, clientHeight } = transformWrapperRef.current.instance.wrapperComponent!;
    transformWrapperRef.current?.setTransform(
      -px + clientWidth / 2,
      -py + clientHeight / 2,
      1,
      400,
      'easeOut',
    );
  }, [diff, map.robots]);

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
          robots={map.robots}
          energyStations={map.energyStations}
        />
      </TransformComponent>
    </TransformWrapper>
  );
}
