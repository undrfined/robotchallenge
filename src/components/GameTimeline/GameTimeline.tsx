import React from 'react';
import styles from './GameTimeline.module.scss';
import Pause from '../../assets/icons/Pause.svg';
import Play from '../../assets/icons/Play.svg';
import Backwards from '../../assets/icons/Backwards.svg';
import Forwards from '../../assets/icons/Forwards.svg';
import { GameConfig } from '../../types/gameTypes';

type OwnProps = {
  roundNumber: number;
  calculatedRounds: number;
  isPaused: boolean;
  gameConfig: GameConfig;
  step: number;
  onTogglePause: VoidFunction;
  onChange: (roundNumber: number) => void;
  onChangeStep: (step: number) => void;
};

export default function GameTimeline({
  roundNumber,
  calculatedRounds,
  isPaused,
  step,
  gameConfig,
  onTogglePause,
  onChange,
  onChangeStep,
}: OwnProps) {
  function handleForwardsClick() {
    if (roundNumber < calculatedRounds) {
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
    if (value >= 0 && value <= calculatedRounds) {
      onChange(value);
    }
  }

  const PlayComponent = isPaused ? Play : Pause;

  return (
    <div className={styles.root}>
      <Backwards onClick={handleBackwardsClick} className={styles.controlButton} />
      <Backwards onClick={() => onChangeStep(step - 1)} className={styles.controlButton} />
      <PlayComponent onClick={onTogglePause} className={styles.controlButton} />
      <Forwards onClick={() => onChangeStep(step + 1)} className={styles.controlButton} />
      <Forwards onClick={handleForwardsClick} className={styles.controlButton} />
      <div className={styles.timelineWrapper}>
        <div
          className={styles.timelineFillTrackCalculated}
          style={{ '--progress': calculatedRounds / gameConfig.roundsCount }}
        />
        <div
          className={styles.timelineFillTrack}
          style={{ '--progress': roundNumber / gameConfig.roundsCount }}
        />

        <input
          type="range"
          className={styles.timeline}
          value={roundNumber}
          max={gameConfig.roundsCount}
          onChange={handleChange}
        />
      </div>
      <div className={styles.roundNumber}>Round #{roundNumber}(${step})</div>
    </div>
  );
}
