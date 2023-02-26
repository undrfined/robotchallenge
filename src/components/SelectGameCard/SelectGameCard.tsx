import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import Lottie from 'lottie-react';
import cn from 'classnames';
import styles from './SelectGameCard.module.scss';
import Button from '../common/Button/Button';
import LOTTIE_ICONS from '../../helpers/lottieIcons';
import type { ApiCategory } from '../../api/types';

type OwnProps = {
  category: ApiCategory;
  onSelect: VoidFunction;
  scrollLeft: number | undefined;
  lastMousePosition: { x: number; y: number };
  onChangeLastMousePosition: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

export default function SelectGameCard({
  category,
  onSelect,
  scrollLeft,
  onChangeLastMousePosition,
  lastMousePosition,
}: OwnProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateY, setRotateY] = useState(0);
  const [rotateX, setRotateX] = useState(0);
  const [posY, setPosY] = useState(0);
  const [posX, setPosX] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [shouldTransition, setShouldTransition] = useState(false);

  const {
    name, descriptionShort, icon, maxPoints,
  } = category;

  const updateRotation = useCallback((clientX: number, clientY: number, isMouse = false) => {
    if (shouldTransition) return;

    function map(val: number, s1: number, e1: number, s2: number, e2: number) {
      return ((val - s1) / (e1 - s1)) * (e2 - s2) + s2;
    }
    const rotateXBase = 6;
    const rotateYBase = 6;
    const {
      x: startX, y: startY, width, height,
    } = ref.current!.getBoundingClientRect();

    const isInBounds = clientX >= startX && clientX <= startX + width
        && clientY >= startY && clientY <= startY + height;
    if (!isInBounds) return;
    setIsHovered(true);
    const endX = startX + width;
    const endY = startY + height;
    setRotateY(
      map(clientX, startX, endX, rotateYBase, -rotateYBase),
    );
    setRotateX(
      map(clientY, startY, endY, -rotateXBase, rotateXBase),
    );
    setPosX(clientX - startX);
    setPosY(clientY - startY);
    if (isMouse) onChangeLastMousePosition({ clientX, clientY } as React.MouseEvent<HTMLButtonElement>);
    if (!isHovered) setShouldTransition(true);
  }, [isHovered, onChangeLastMousePosition, shouldTransition]);

  useEffect(() => {
    if (scrollLeft === undefined || !lastMousePosition.x || !lastMousePosition.y) return;
    updateRotation(lastMousePosition.x, lastMousePosition.y);
  }, [scrollLeft, lastMousePosition.x, lastMousePosition.y, updateRotation]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (shouldTransition) return;
    updateRotation(e.clientX, e.clientY, true);
  }

  function handleMouseOut() {
    setShouldTransition(true);
    setIsHovered(false);
  }

  return (
    <div
      className={cn(styles.root, shouldTransition && styles.transition)}
      onTransitionEnd={() => setShouldTransition(false)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseOut}
      ref={ref}
      style={{
        '--pos-x': `${posX}px`,
        '--pos-y': `${posY}px`,
        '--rotate-x': isHovered ? `${rotateX}deg` : '0deg',
        '--rotate-y': isHovered ? `${rotateY}deg` : '0deg',
      }}
    >
      <Lottie animationData={LOTTIE_ICONS[icon]} loop className={styles.animation} />
      <h2 className={styles.name}>{name}</h2>
      <div className={styles.description}>{descriptionShort}</div>
      <div className={styles.prize}>
        <Lottie animationData={LOTTIE_ICONS.Diamond} loop className={styles.diamondAnimation} />
        <div className={styles.prizeText}>Max Points: {maxPoints}</div>
      </div>
      <Button className={styles.button} onClick={onSelect}>Upload solution</Button>
    </div>
  );
}
