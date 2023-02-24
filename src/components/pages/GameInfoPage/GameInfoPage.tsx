import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './GameInfoPage.module.scss';
import useAppSelector from '../../../hooks/useAppSelector';
import useAppDispatch from '../../../hooks/useAppDispatch';
import { GameId, startGame } from '../../../store/slices/gamesSlice';
import { selectGames } from '../../../store/selectors/gamesSelectors';
import { selectCategory } from '../../../store/selectors/categoriesSelectors';
import Back from '../../../assets/icons/Back.svg';
import UploadFile from '../../common/UploadFile/UploadFile';
import Button from '../../common/Button/Button';
import { isTruthy } from '../../../helpers/isTruthy';
import AnimatedText from '../../common/AnimatedText/AnimatedText';
import Checkbox from '../../common/Checkbox/Checkbox';
import Avatar from '../../common/Avatar/Avatar';
import Version from '../../../assets/icons/Version.svg';
import Code from '../../../assets/icons/Code.svg';
import Dropdown from '../../../assets/icons/Dropdown.svg';
import { fetchAlgoFile, fetchAlgos, uploadAlgo } from '../../../store/slices/algosSlice';
import { ApiAlgo, ApiAlgoWithFile } from '../../../api/types';

export default function GameInfoPage() {
  const { categoryId } = useParams() as { categoryId: string };
  const categoryIdInt = Number(categoryId);
  const category = useAppSelector(selectCategory(categoryIdInt));
  if (!category) throw new Error('Category not found');

  const { isLoading } = useAppSelector(selectGames);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const algos = useAppSelector((state) => state.algos.algos);
  const [file, setFile] = useState<Omit<ApiAlgoWithFile, 'id' | 'userId'> | undefined>();
  const [selected, setSelected] = useState<number[]>([]);

  const handleUploadFile = useCallback((newFile: Omit<ApiAlgoWithFile, 'id' | 'userId'> | undefined) => {
    setFile(file);
    if (newFile) {
      dispatch(uploadAlgo(newFile.file!));
    }
  }, [dispatch, file]);

  const handleSelectFile = useCallback((checked: boolean, id: number) => {
    setSelected(checked ? [...selected, id] : selected.filter((q) => q !== id));
    if (checked) dispatch(fetchAlgoFile(id));
  }, [dispatch, selected]);

  useEffect(() => {
    dispatch(fetchAlgos());
  }, [dispatch]);

  const handleStartGame = useCallback(() => {
    const selectedFiles = selected.map((l) => algos[l]);
    const allAlgos = [...selectedFiles, file].filter(isTruthy) as ApiAlgo[];
    dispatch(startGame({
      algos: allAlgos,
      categoryId: categoryIdInt,
    })).then((a) => {
      // TODO types?
      const { id } = a.payload as { id: GameId };
      navigate(`/game/${id}`);
    });
  }, [categoryIdInt, dispatch, file, algos, navigate, selected]);

  return (
    <div className={styles.root}>
      <div className={styles.info}>
        <h1>
          <Back onClick={() => navigate('/')} className={styles.closeButton} />
          <AnimatedText text={category.name} containerType="span" delay={0} />
        </h1>
        <AnimatedText text={category.description} containerType="p" delay={200} />

        <div className={styles.timer}>
          <h4>TIME REMAINING</h4>
          <div className={styles.timerRemaining}>
            <div>10 days</div>
            <div>12 hours</div>
            <div>17 minutes</div>
          </div>
        </div>
        <div className={styles.selectOpponents}>
          <h2>Select opponents & Version</h2>

          <div className={styles.opponents}>
            {Object.values(algos).map((l) => (
              // eslint-disable-next-line react/no-array-index-key
              <div className={styles.opponent} key={l.id}>
                <Avatar size="small" userId={l.userId} />
                <div className={styles.opponentName}>{l.language}</div>

                <div className={styles.dropdown}>
                  <Version />
                  <div className={styles.dropdownName}>
                    Version
                  </div>
                  <div className={styles.dropdownContent}>
                    {l.version}
                  </div>
                  <Dropdown />
                </div>

                <div className={styles.dropdown}>
                  <Code />
                  <div className={styles.dropdownName}>
                    Algorithm
                  </div>
                  <div className={styles.dropdownContent}>
                    {l.name}
                  </div>
                  <Dropdown />
                </div>

                <Checkbox
                  checked={!l.isLoading && selected.includes(l.id)}
                  className={styles.checkbox}
                  index={l.id}
                  onToggle={handleSelectFile}
                  isLoading={l.isLoading}
                />
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className={styles.instructions}>
        <h2>Step by step instruction</h2>

        <ol>
          <li>Download the game</li>
          <li>Upload your algorithm</li>
          <li>Start the game</li>
        </ol>

        <UploadFile
          accept="application/wasm"
          file={file}
          setFile={handleUploadFile}
        />

        <Button onClick={handleStartGame}>
          {isLoading ? 'loading...' : 'START'}
        </Button>
      </div>
    </div>
  );
}
