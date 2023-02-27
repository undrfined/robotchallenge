import { selectUser } from '../store/selectors/usersSelectors';
import { getUserById } from '../store/slices/usersSlice';
import useEnsure from './useEnsure';

export default function useEnsureUser(userId: string) {
  return useEnsure(userId, selectUser, getUserById);
}
