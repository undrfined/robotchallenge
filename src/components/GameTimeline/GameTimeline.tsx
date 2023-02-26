import React from 'react';
import styles from './GameTimeline.module.scss';
import Pause from '../../assets/icons/Pause.svg';
import Play from '../../assets/icons/Play.svg';
import Backwards from '../../assets/icons/Backwards.svg';
import Forwards from '../../assets/icons/Forwards.svg';
import type { GameConfig } from '../../types/gameTypes';

type OwnProps = {
  roundNumber: number;
  calculatedRounds: number;
  isPaused: boolean;
  gameConfig: GameConfig;
  step: number | undefined;
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
    onChange(Math.min(calculatedRounds, roundNumber + 1));
  }

  function handleBackwardsClick() {
    onChange(Math.max(0, roundNumber - 1));
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
      <Backwards
        onClick={() => {
          if (step === undefined) return;
          onChangeStep(step - 1);
        }}
        className={styles.controlButton}
      />
      <PlayComponent onClick={onTogglePause} className={styles.controlButton} />
      <Forwards
        onClick={() => {
          if (step === undefined) {
            onChangeStep(0);
            return;
          }
          onChangeStep(step + 1);
        }}
        className={styles.controlButton}
      />
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
      <div className={styles.roundNumber}>Round #{roundNumber}, Step #{step}</div>
    </div>
  );
}
