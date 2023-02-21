import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SelectGamePage.module.scss';
import SelectGameCard from '../../SelectGameCard/SelectGameCard';
import { selectCategories } from '../../../store/selectors/categoriesSelectors';
import useAppSelector from '../../../hooks/useAppSelector';
import { CategoryId } from '../../../store/slices/categoriesSlice';
import AnimatedText from '../../common/AnimatedText/AnimatedText';
import useAppDispatch from '../../../hooks/useAppDispatch';
import { getUserInfo, login, logout } from '../../../store/slices/authSlice';
import Button from '../../common/Button/Button';
import Github from '../../../assets/icons/Github.svg';
import Avatar from '../../common/Avatar/Avatar';
import useContextMenu from '../../../hooks/useContextMenu';
import Code from '../../../assets/icons/Code.svg';
import Close from '../../../assets/icons/Close.svg';

export default function SelectGamePage() {
  const navigate = useNavigate();
  const categories = useAppSelector(selectCategories);
  const user = useAppSelector((state) => state.auth.user);
  const isLoggingIn = useAppSelector((state) => state.auth.isLoggingIn);
  const dispatch = useAppDispatch();

  const handleSelectCategory = (id: CategoryId) => {
    return () => {
      navigate(`/gameinfo/${id}`);
    };
  };

  const handleLogin = () => {
    if (!user && !isLoggingIn) {
      dispatch(login());
    } else {
      // TODO open user profile
    }
  };

  useEffect(() => {
    if (!user && isLoggingIn) {
      dispatch(getUserInfo());
    }
  }, [dispatch, isLoggingIn, user]);

  const {
    openContextMenu, contextMenu,
  } = useContextMenu([
    user?.role === 'admin' && {
      label: 'Admin Panel',
      onClick: () => {
        navigate('/admin/');
      },
      icon: Code,
    },
    {
      label: 'Log Out',
      icon: Close,
      onClick: () => {
        dispatch(logout());
      },
    },
  ]);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <AnimatedText text="Select an educational program" containerType="h1" shouldHidePostfix={false} />
        <div className={styles.headerButtons}>
          <Button onClick={handleLogin} buttonStyle="white" onContextMenu={openContextMenu}>
            {user ? (
              <>
                <Avatar userId={user.id} size="tiny" />
                {user.name}
              </>
            ) : (
              <>
                <Github />
                {isLoggingIn ? 'Loading...' : 'Sign in'}
              </>
            )}
            {contextMenu}
          </Button>
        </div>
      </header>
      <main className={styles.gameCards}>
        {categories.map(({
          id, title, description, maxPoints, icon,
        }) => (
          <SelectGameCard
            key={id}
            icon={icon}
            title={title}
            description={description}
            maxPoints={maxPoints}
            onSelect={handleSelectCategory(id)}
          />
        ))}
      </main>
    </div>
  );
}
