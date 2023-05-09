import React from 'react';
import cn from 'classnames';
import styles from './PlayerCardStats.module.scss';
import type { IconType } from '../Icon/Icon';
import Icon from '../Icon/Icon';

type OwnProps = {
  children: React.ReactNode;
  icon: IconType;
  className?: string;
};

export function PlayerCardStats({
  children,
  icon,
  className,
}: OwnProps) {
  return (
    <div className={cn(styles.root, className)}>
      <div className={styles.iconWrapper}>
        <Icon name={icon} className={styles.icon} />
      </div>
      <div className={styles.text}>{children}</div>
    </div>
  );
}
