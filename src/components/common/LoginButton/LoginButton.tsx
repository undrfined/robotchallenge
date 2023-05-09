import React from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../Avatar/Avatar';
import Button from '../Button/Button';
import useEnsureUserGroup from '../../../hooks/useEnsureUserGroup';
import useAppSelector from '../../../hooks/useAppSelector';
import { selectCurrentUser } from '../../../store/selectors/usersSelectors';
import { login, logout } from '../../../store/slices/authSlice';
import useContextMenu from '../../../hooks/useContextMenu';
import useAppDispatch from '../../../hooks/useAppDispatch';
import { selectIsLoggingIn } from '../../../store/selectors/authSelectors';
import Icon from '../Icon/Icon';

type OwnProps = {
  withContextMenu?: boolean;
  className?: string;
};

export default function LoginButton({
  withContextMenu,
  className,
}: OwnProps) {
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const userGroup = useEnsureUserGroup(user?.userGroupId);
  const dispatch = useAppDispatch();
  const isLoggingIn = useAppSelector(selectIsLoggingIn);

  const handleLogin = () => {
    if (!user && !isLoggingIn) {
      dispatch(login());
    } else {
      // TODO open user profile
    }
  };

  const {
    openContextMenu, contextMenu,
  } = useContextMenu([
    user?.role === 'admin' && {
      label: 'Admin Panel',
      onClick: () => {
        navigate('/admin/');
      },
      icon: 'Code',
    },
    {
      label: 'Log Out',
      icon: 'Close',
      onClick: () => {
        dispatch(logout());
      },
    },
  ], !withContextMenu);

  return (
    <Button onClick={handleLogin} buttonStyle="white" onContextMenu={openContextMenu} className={className}>
      {user ? (
        <>
          <Avatar userId={user.id} size="tiny" />
          {user.name}
          {userGroup && ` (${userGroup.name})`}
        </>
      ) : (
        <>
          <Icon name="Github" />
          {isLoggingIn ? 'Loading...' : 'Sign in'}
        </>
      )}
      {contextMenu}
    </Button>
  );
}
