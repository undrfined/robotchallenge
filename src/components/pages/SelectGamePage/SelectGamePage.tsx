import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SelectGamePage.module.scss';
import SelectGameCard from '../../SelectGameCard/SelectGameCard';
import { selectCategories } from '../../../store/selectors/categoriesSelectors';
import useAppSelector from '../../../hooks/useAppSelector';
import { CategoryId } from '../../../store/slices/categoriesSlice';
import AnimatedText from '../../common/AnimatedText/AnimatedText';
import useAppDispatch from '../../../hooks/useAppDispatch';
import { getUserInfo, login } from '../../../store/slices/authSlice';

export default function SelectGamePage() {
  const navigate = useNavigate();
  const categories = useAppSelector(selectCategories);
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();

  const handleSelectCategory = (id: CategoryId) => {
    return () => {
      navigate(`/gameinfo/${id}`);
    };
  };

  const handleLogin = () => {
    dispatch(login());
  };

  useEffect(() => {
    // setTimeout(() => {
    dispatch(getUserInfo());
    // }, 5000);
  }, [dispatch]);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <AnimatedText text="Select an educational program" containerType="h1" shouldHidePostfix={false} />
        <button onClick={handleLogin}>Login</button>
        <img src={user?.avatarUrl} alt="" />
        <div>{user?.id}</div>
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
