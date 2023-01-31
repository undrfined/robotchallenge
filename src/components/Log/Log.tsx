import React from 'react';
import cn from 'classnames';
import styles from './Log.module.scss';
import Close from '../../assets/icons/Close.svg';

type OwnProps = {
  isOpen?: boolean;
  viewingLogId?: number;
  onClose: VoidFunction;
  logs: Record<number, {
    log: string,
    errorLog: string,
  }>;
};
export default function Log({
  isOpen,
  viewingLogId,
  onClose,
  logs,
}: OwnProps) {
  return (
    <div
      className={cn(
        styles.root,
        isOpen && styles.open,
      )}
    >
      <div className={styles.header}>
        <h2>Log</h2>
        <Close className={styles.closeButton} onClick={onClose} />
      </div>

      {viewingLogId !== undefined && (
        <div className={styles.content}>
          {logs[viewingLogId]?.log.split('\n').map((line, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={i}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}
