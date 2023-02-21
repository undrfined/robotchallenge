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
    dispatch(user ? logout() : login());
  };

  useEffect(() => {
    if (!user && isLoggingIn) {
      dispatch(getUserInfo());
    }
  }, [dispatch, isLoggingIn, user]);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <AnimatedText text="Select an educational program" containerType="h1" shouldHidePostfix={false} />
        <Button onClick={handleLogin} buttonStyle="white">
          {user ? (
            <>
              <Avatar avatar={user.avatarUrl} size="tiny" />
              {user.name}
            </>
          ) : (
            <>
              <Github />
              {isLoggingIn ? 'Loading...' : 'Sign in'}
            </>
          )}
        </Button>
        {/* <button onClick={handleLogin}>Login</button> */}
        {/* <img src={user?.avatarUrl} alt="" /> */}
        {/* <div>{user?.name}</div> */}
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
