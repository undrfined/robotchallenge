import React, { useEffect } from 'react';
import cn from 'classnames';
import styles from './Avatar.module.scss';
import useAppSelector from '../../../hooks/useAppSelector';
import useAppDispatch from '../../../hooks/useAppDispatch';
import { getUserById } from '../../../store/slices/usersSlice';

type OwnProps = {
  avatar?: string;
  userId?: string;
  size: 'big' | 'small' | 'tiny';
  className?: string;
};

export default function Avatar({
  avatar, size, className, userId,
}: OwnProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => (userId ? state.users.users[userId] : undefined));

  useEffect(() => {
    if (userId && !user) {
      dispatch(getUserById(userId));
    }
  }, [dispatch, user, userId]);
  return <img src={user?.avatarUrl || avatar} alt="Avatar" className={cn(styles.root, styles[size], className)} />;
}
