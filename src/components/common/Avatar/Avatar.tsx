import React from 'react';
import cn from 'classnames';
import styles from './Avatar.module.scss';
import useEnsureUser from '../../../hooks/useEnsureUser';

type OwnProps = {
  userId: string;
  size: 'big' | 'small' | 'tiny';
  className?: string;
};

export default function Avatar({
  size, className, userId,
}: OwnProps) {
  const user = useEnsureUser(userId);

  // TODO replace with thumbnail
  return <img src={user?.avatarUrl} alt="Avatar" className={cn(styles.root, styles[size], className)} />;
}
