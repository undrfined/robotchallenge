import { useEffect } from 'react';
import { selectUser } from '../store/selectors/usersSelectors';
import useAppDispatch from './useAppDispatch';
import useAppSelector from './useAppSelector';
import { getUserById } from '../store/slices/usersSlice';

export default function useEnsureUser(userId: string) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser(userId));

  useEffect(() => {
    if (user) return;
    dispatch(getUserById(userId));
  }, [dispatch, userId, user]);

  return user;
}
