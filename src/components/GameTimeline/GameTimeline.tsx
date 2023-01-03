import React from 'react';
import styles from './GameTimeline.module.scss';
import Pause from '../../assets/icons/Pause.svg';
import Play from '../../assets/icons/Play.svg';
import Backwards from '../../assets/icons/Backwards.svg';
import Forwards from '../../assets/icons/Forwards.svg';
import { GameConfig } from '../../types/gameTypes';

type OwnProps = {
  roundNumber: number;
  isPaused: boolean;
  gameConfig: GameConfig;
  onPauseClick: VoidFunction;
  onChange: (roundNumber: number) => void;
};

export default function GameTimeline({
  roundNumber,
  isPaused,
  gameConfig,
  onPauseClick,
  onChange,
}: OwnProps) {
  function handleForwardsClick() {
    if (roundNumber < gameConfig.roundsCount) {
      onChange(roundNumber + 1);
    }
  }

  function handleBackwardsClick() {
    if (roundNumber > 0) {
      onChange(roundNumber - 1);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = Number(e.target.value);
    if (value >= 0 && value <= gameConfig.roundsCount) {
      onChange(value);
    }
  }

  const PlayComponent = isPaused ? Play : Pause;

  return (
    <div className={styles.root}>
      <Backwards onClick={handleBackwardsClick} className={styles.controlButton} />
      <PlayComponent onClick={onPauseClick} className={styles.controlButton} />
      <Forwards onClick={handleForwardsClick} className={styles.controlButton} />
      <div className={styles.timelineWrapper}>
        <div className={styles.timelineFillTrack} style={{ '--progress': roundNumber / gameConfig.roundsCount }} />

        <input
          type="range"
          className={styles.timeline}
          value={roundNumber}
          max={gameConfig.roundsCount}
          onChange={handleChange}
        />
      </div>
      <div className={styles.roundNumber}>Round #{roundNumber}</div>
    </div>
  );
}
