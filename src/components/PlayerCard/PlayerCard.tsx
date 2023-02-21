import React from 'react';
import styles from './PlayerCard.module.scss';
import Label from '../common/Label/Label';
import { PlayerCardStats } from '../common/PlayerCardStats/PlayerCardStats';
import EnergyIcon from '../../assets/icons/EnergyIcon.svg';
import RobotIcon from '../../assets/icons/RobotIcon.svg';
import More from '../../assets/icons/More.svg';
import Log from '../../assets/icons/Log.svg';
import useContextMenu from '../../hooks/useContextMenu';
import Avatar from '../common/Avatar/Avatar';

type OwnProps = {
  playerName: string;
  playerColor: string;
  userId: string;
  rank: number;
  energy: number;
  robotsLeft: number;
  maxRobots: number;
  onViewLog: VoidFunction;
};

export default function PlayerCard({
  playerName,
  playerColor,
  userId,
  rank,
  energy,
  robotsLeft,
  maxRobots,
  onViewLog,
}: OwnProps) {
  const {
    openContextMenu,
    contextMenu,
  } = useContextMenu([
    {
      label: 'View log',
      icon: Log,
      onClick: onViewLog,
    },
  ]);

  return (
    <div className={styles.root} style={{ '--player-color': playerColor }}>
      <Avatar userId={userId} size="big" className={styles.avatar} />
      <div className={styles.info}>
        <div className={styles.playerName}>{playerName}</div>
        <div className={styles.stats}>
          <PlayerCardStats icon={EnergyIcon}>{energy}</PlayerCardStats>
          <PlayerCardStats icon={RobotIcon}>{robotsLeft}/{maxRobots}</PlayerCardStats>
          <More className={styles.more} onClick={openContextMenu} />
          {contextMenu}
        </div>
      </div>
      <Label className={styles.label}>
        #{rank}
      </Label>
    </div>
  );
}
