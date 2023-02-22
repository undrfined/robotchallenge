import React, { useCallback, useRef } from 'react';
import styles from './AdminPage.module.scss';
import Button from '../../common/Button/Button';
import useAppDispatch from '../../../hooks/useAppDispatch';
import { addCategory } from '../../../store/slices/categoriesSlice';
import { LottieIcon } from '../../../helpers/lottieIcons';

export default function AdminPage() {
  const dispatch = useAppDispatch();

  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);
  const descriptionShortRef = useRef<HTMLInputElement>(null);
  const maxPointsRef = useRef<HTMLInputElement>(null);
  const iconRef = useRef<HTMLInputElement>(null);

  const handleAddCategory = useCallback(() => {
    dispatch(addCategory({
      newCategory: {
        icon: iconRef.current!.value as LottieIcon,
        name: nameRef.current!.value,
        description: descriptionRef.current!.value,
        descriptionShort: descriptionShortRef.current!.value,
        maxPoints: Number(maxPointsRef.current!.value),
        gameConfig: {
          width: 16,
          roundsCount: 50,
          playersCount: 0, // algos.length,
          initialRobotsCount: 10,
          startEnergy: 50,
          rngSeed: 123,
          energyStationsPerRobot: 2,
          energyLossToCloneRobot: 10,
          maxRobotsCount: 50,
          timeout: 1000,
          maxTimeoutsCount: 5,
          energyCollectDistance: 2,
        },
      },
    }));
  }, [dispatch]);

  return (
    <div className={styles.root}>
      <h1>Admin Page</h1>
      <input type="text" ref={nameRef} placeholder="Name" />
      <input type="text" ref={descriptionRef} placeholder="Description" />
      <input type="text" ref={descriptionShortRef} placeholder="Short Description" />
      <input type="text" ref={maxPointsRef} placeholder="Max Points" inputMode="numeric" />
      <input type="text" ref={iconRef} placeholder="Icon" />
      <Button onClick={handleAddCategory}>Add category</Button>
    </div>
  );
}
