import React from 'react';
import styles from './NotSupportedPage.module.scss';

export default function NotSupportedPage() {
  return (
    <div className={styles.root}>
      <h1>Not supported :(</h1>
      <p>Please open this page on the desktop</p>
    </div>
  );
}
