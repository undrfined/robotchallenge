import React from 'react';
import cn from 'classnames';
import styles from './PlayerCardStats.module.scss';

type OwnProps = {
  children: React.ReactNode;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  className?: string;
};

export function PlayerCardStats({
  children,
  icon,
  className,
}: OwnProps) {
  const Icon = icon;
  return (
    <div className={cn(styles.root, className)}>
      <div className={styles.iconWrapper}>
        <Icon className={styles.icon} />
      </div>
      <div className={styles.text}>{children}</div>
    </div>
  );
}
