import React from 'react';
import styles from './SelectGamePage.module.scss';
import SelectGameCard from '../../SelectGameCard/SelectGameCard';
import RobotIcon from '../../../assets/lottie/Robot.json';
import LightningIcon from '../../../assets/lottie/Lightning.json';

export default function SelectGamePage() {
  return (
    <div className={styles.root}>
      <header>
        <h1>Select an educational program ...\\\</h1>
      </header>
      <main className={styles.gameCards}>
        <SelectGameCard
          icon={RobotIcon}
          title="Robot Challenge"
          description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quidem."
          maxPoints={10}
        />
        <SelectGameCard
          icon={LightningIcon}
          title="Blitz"
          description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quidem."
          maxPoints={10}
        />
      </main>
    </div>
  );
}
