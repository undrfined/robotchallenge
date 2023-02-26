import React, { useCallback, useEffect } from 'react';
import Modal from '../common/Modal/Modal';
import useAppDispatch from '../../hooks/useAppDispatch';
import { attachToUserGroup, fetchUserGroups } from '../../store/slices/userGroupsSlice';
import useAppSelector from '../../hooks/useAppSelector';
import { selectCurrentUser } from '../../store/selectors/usersSelectors';
import Button from '../common/Button/Button';
import styles from './SelectGroupModal.module.scss';

export default function SelectGroupModal() {
  const dispatch = useAppDispatch();
  const userGroups = useAppSelector((state) => state.userGroups.userGroups);
  const user = useAppSelector(selectCurrentUser);

  useEffect(() => {
    dispatch(fetchUserGroups());
  }, [dispatch]);

  const handleSelectGroup = useCallback((id: number) => {
    return () => {
      dispatch(attachToUserGroup(id));
    };
  }, [dispatch]);

  return (
    <Modal isOpen={Boolean(user && user.userGroupId === undefined)} className={styles.root}>
      <h2>Select your group</h2>
      {userGroups.map((group) => <Button key={group.id} onClick={handleSelectGroup(group.id)}>{group.name}</Button>)}
    </Modal>
  );
}
