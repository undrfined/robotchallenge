import React from 'react';
import Lottie from 'lottie-react';
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
  return (
    <div className={styles.root}>
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
