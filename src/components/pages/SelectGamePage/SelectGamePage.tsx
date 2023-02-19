import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SelectGamePage.module.scss';
import SelectGameCard from '../../SelectGameCard/SelectGameCard';
import { selectCategories } from '../../../store/selectors/categoriesSelectors';
import useAppSelector from '../../../hooks/useAppSelector';
import { CategoryId } from '../../../store/slices/categoriesSlice';
import AnimatedText from '../../common/AnimatedText/AnimatedText';
import makeRequest from '../../../api/makeRequest';

export default function SelectGamePage() {
  const navigate = useNavigate();
  const categories = useAppSelector(selectCategories);

  const handleSelectCategory = (id: CategoryId) => {
    return () => {
      navigate(`/gameinfo/${id}`);
    };
  };

  makeRequest('api').then(console.log);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <AnimatedText text="Select an educational program" containerType="h1" shouldHidePostfix={false} />
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
