import React from 'react';
import Lottie from 'lottie-react';
import styles from './PlayerCard.module.scss';
import Label from '../common/Label/Label';
import { PlayerCardStats } from '../common/PlayerCardStats/PlayerCardStats';
import EnergyIcon from '../../assets/icons/EnergyIcon.svg';
import RobotIcon from '../../assets/icons/RobotIcon.svg';
import Crown from '../../assets/lottie/Crown.json';

type OwnProps = {
  avatar: string;
  playerName: string;
  playerColor: string;
  rank: number;
  energy: number;
  robotsLeft: number;
  maxRobots: number;
};

export default function PlayerCard({
  playerName,
  playerColor,
  avatar,
  rank,
  energy,
  robotsLeft,
  maxRobots,
}: OwnProps) {
  return (
    <div className={styles.root} style={{ '--player-color': playerColor }}>
      <img src={avatar} alt="Avatar" className={styles.avatar} />
      {rank === 1 && <Lottie animationData={Crown} loop className={styles.crown} />}
      <div className={styles.info}>
        <div className={styles.playerName}>{playerName}</div>
        <div className={styles.stats}>
          <PlayerCardStats icon={EnergyIcon}>{energy}</PlayerCardStats>
          <PlayerCardStats icon={RobotIcon}>{robotsLeft}/{maxRobots}</PlayerCardStats>
        </div>
      </div>
      <Label className={styles.label}>
        #{rank}
      </Label>
    </div>
  );
}
