import React, { useRef, useState } from 'react';
import Lottie from 'lottie-react';
import cn from 'classnames';
import styles from './SelectGameCard.module.scss';
import Button from '../common/Button/Button';
import LOTTIE_ICONS, { LottieIcon } from '../../helpers/lottieIcons';

type OwnProps = {
  icon: LottieIcon;
  title: string;
  description: string;
  maxPoints: number;
  onSelect: VoidFunction;
};

export default function SelectGameCard({
  icon,
  title,
  description,
  maxPoints,
  onSelect,
}: OwnProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateY, setRotateY] = useState(0);
  const [rotateX, setRotateX] = useState(0);
  const [posY, setPosY] = useState(0);
  const [posX, setPosX] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [shouldTransition, setShouldTransition] = useState(false);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (shouldTransition) return;
    setIsHovered(true);
    function map(val: number, s1: number, e1: number, s2: number, e2: number) {
      return ((val - s1) / (e1 - s1)) * (e2 - s2) + s2;
    }
    const rotateXBase = 6;
    const rotateYBase = 6;
    const {
      x: startX, y: startY, width, height,
    } = ref.current!.getBoundingClientRect();
    const endX = startX + width;
    const endY = startY + height;
    const { clientX, clientY } = e;
    setRotateY(
      map(clientX, startX, endX, rotateYBase, -rotateYBase),
    );
    setRotateX(
      map(clientY, startY, endY, -rotateXBase, rotateXBase),
    );
    setPosX(clientX - startX);
    setPosY(clientY - startY);
    if (!isHovered) setShouldTransition(true);
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
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.description}>{description}</div>
      <div className={styles.prize}>
        <Lottie animationData={LOTTIE_ICONS.Diamond} loop className={styles.diamondAnimation} />
        <div className={styles.prizeText}>Max Points: {maxPoints}</div>
      </div>
      <Button className={styles.button} onClick={onSelect}>Upload solution</Button>
    </div>
  );
}
