import React from 'react';
import styles from './Loader.module.scss';

type OwnProps = {
  progress?: number;
};

export default function Loader({
  progress = 0.5,
}: OwnProps) {
  return (
    <svg viewBox="0 0 24 24" className={styles.root}>
      <circle
        cx="12"
        cy="12"
        strokeWidth="2"
        r="11"
        fill="none"
        className={styles.loaderRect}
        style={{ '--progress': progress }}
      />
    </svg>
  );
}
