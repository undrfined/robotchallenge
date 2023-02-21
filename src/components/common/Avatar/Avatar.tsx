import React from 'react';
import cn from 'classnames';
import styles from './Avatar.module.scss';

type OwnProps = {
  avatar: string;
  size: 'big' | 'small' | 'tiny';
  className?: string;
};

export default function Avatar({ avatar, size, className }: OwnProps) {
  return <img src={avatar} alt="Avatar" className={cn(styles.root, styles[size], className)} />;
}
