import useEnsure from './useEnsure';
import { fetchUserGroups } from '../store/slices/userGroupsSlice';
import { selectUserGroup } from '../store/selectors/userGroupsSelectors';

export default function useEnsureUserGroup(userGroupId: number | undefined) {
  return useEnsure(userGroupId, selectUserGroup, fetchUserGroups);
}
