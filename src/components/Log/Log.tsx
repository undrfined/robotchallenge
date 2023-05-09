import React from 'react';
import cn from 'classnames';
import styles from './Log.module.scss';
import useAppSelector from '../../hooks/useAppSelector';
import { selectGame } from '../../store/selectors/gamesSelectors';
import type { GameId } from '../../store/slices/gamesSlice';
import Icon from '../common/Icon/Icon';

type OwnProps = {
  isOpen?: boolean;
  viewingLogId?: number;
  gameId: GameId;
  onClose: VoidFunction;
};
export default function Log({
  isOpen,
  viewingLogId,
  onClose,
  gameId,
}: OwnProps) {
  const { logs } = useAppSelector(selectGame(gameId));

  return (
    <div
      className={cn(
        styles.root,
        isOpen && styles.open,
      )}
    >
      <div className={styles.header}>
        <h2>Log</h2>
        <Icon name="Close" className={styles.closeButton} onClick={onClose} />
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
