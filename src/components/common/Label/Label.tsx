import React from 'react';
import cn from 'classnames';
import styles from './Label.module.scss';
import LabelIcon from './LabelIcon.svg';

type OwnProps = {
  className?: string;
  children?: React.ReactNode;
};

export default function Label({
  children,
  className,
}: OwnProps) {
  return (
    <div className={cn(styles.root, className)}>
      <LabelIcon className={styles.labelIcon} />
      <div className={styles.labelText}>{children}</div>
    </div>
  );
}
