import React, {
  useCallback, useEffect, useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SelectGamePage.module.scss';
import SelectGameCard from '../../SelectGameCard/SelectGameCard';
import { selectCategories } from '../../../store/selectors/categoriesSelectors';
import useAppSelector from '../../../hooks/useAppSelector';
import type { CategoryId } from '../../../store/slices/categoriesSlice';
import AnimatedText from '../../common/AnimatedText/AnimatedText';
import useAppDispatch from '../../../hooks/useAppDispatch';
import SelectGroupModal from '../../SelectGroupModal/SelectGroupModal';
import { getUserById } from '../../../store/slices/usersSlice';
import { selectCurrentUser } from '../../../store/selectors/usersSelectors';
import LoginButton from '../../common/LoginButton/LoginButton';
import { selectIsLoggingIn } from '../../../store/selectors/authSelectors';

export default function SelectGamePage() {
  const navigate = useNavigate();
  const categories = useAppSelector(selectCategories);
  const user = useAppSelector(selectCurrentUser);
  const isLoggingIn = useAppSelector(selectIsLoggingIn);
  const dispatch = useAppDispatch();

  const handleSelectCategory = (id: CategoryId) => {
    return () => {
      navigate(`/gameinfo/${id}`);
    };
  };

  useEffect(() => {
    if (!user && isLoggingIn) {
      dispatch(getUserById());
    }
  }, [dispatch, isLoggingIn, user]);

  const [scrollLeft, setScrollLeft] = useState<number | undefined>(undefined);
  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    setScrollLeft(e.currentTarget.scrollLeft);
  }

  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 });

  const handleLastMousePos = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    setLastMousePosition({ x: e.clientX, y: e.clientY });
    setScrollLeft(undefined);
  }, [setLastMousePosition]);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <AnimatedText text="Select an educational program" containerType="h1" shouldHidePostfix={false} />
        <div className={styles.headerButtons}>
          <LoginButton withContextMenu />
        </div>
      </header>
      <main className={styles.gameCards} onScroll={handleScroll}>
        {categories.map((category) => (
          <SelectGameCard
            key={category.id}
            category={category}
            onSelect={handleSelectCategory(category.id)}
            scrollLeft={scrollLeft}
            lastMousePosition={lastMousePosition}
            onChangeLastMousePosition={handleLastMousePos}
          />
        ))}
      </main>

      <SelectGroupModal />
    </div>
  );
}
