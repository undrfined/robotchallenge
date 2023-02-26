import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './GameInfoPage.module.scss';
import useAppSelector from '../../../hooks/useAppSelector';
import useAppDispatch from '../../../hooks/useAppDispatch';
import { selectGames } from '../../../store/selectors/gamesSelectors';
import { selectCategory } from '../../../store/selectors/categoriesSelectors';
import Back from '../../../assets/icons/Back.svg';
import UploadFile from '../../common/UploadFile/UploadFile';
import Button from '../../common/Button/Button';
import AnimatedText from '../../common/AnimatedText/AnimatedText';
import { fetchAlgoFile, fetchAlgos, uploadAlgo } from '../../../store/slices/algosSlice';
import OpponentCard from '../../common/OpponentCard/OpponentCard';
import { GameLibraryInfo } from '../../../types/gameTypes';
import { ApiAlgoId, ApiAlgoVersionId } from '../../../api/types';
import { isTruthy } from '../../../helpers/isTruthy';
import { GameId, startGame } from '../../../store/slices/gamesSlice';

export default function GameInfoPage() {
  const { categoryId } = useParams() as { categoryId: string };
  const categoryIdInt = Number(categoryId);

  const category = useAppSelector(selectCategory(categoryIdInt));
  if (!category) throw new Error('Category not found');

  const { isLoading } = useAppSelector(selectGames);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const algosByUser = useAppSelector((state) => state.algos.algos);
  const versions = useAppSelector((state) => state.algos.algoVersions);

  const [file, setFile] = useState<{
    file: Blob;
    info: GameLibraryInfo;
  } | undefined>();

  // TODO we probably need a way to select multiple algo version from the same user, need to consult with Anna
  const [selected, setSelected] = useState<{
    userId: string; algoId: ApiAlgoId; algoVersionId: ApiAlgoVersionId;
  }[]>([]);

  const handleUploadFile = useCallback((newFile: {
    file: Blob;
    info: GameLibraryInfo;
  } | undefined) => {
    setFile(file);
    if (newFile) {
      dispatch(uploadAlgo(newFile.file!));
    }
  }, [dispatch, file]);

  const handleSelectFile = useCallback((
    checked: boolean, selectedUserId: string, algoId: ApiAlgoId, algoVersionId: ApiAlgoVersionId,
  ) => {
    const withoutUser = selected.filter((q) => q.userId !== selectedUserId);
    setSelected(checked
      ? [...withoutUser, { userId: selectedUserId, algoId, algoVersionId }]
      : withoutUser);
    if (checked) dispatch(fetchAlgoFile({ algoVersionId, algoId }));
  }, [dispatch, selected]);

  useEffect(() => {
    dispatch(fetchAlgos());
  }, [dispatch]);

  const handleStartGame = useCallback(() => {
    const selectedFiles = selected.map((l) => versions[l.algoId][l.algoVersionId]);
    const allAlgos = [...selectedFiles].filter(isTruthy); // TODO include current file
    dispatch(startGame({
      algoVersions: allAlgos,
      categoryId: categoryIdInt,
    })).then((a) => {
      // TODO types?
      const { id } = a.payload as { id: GameId };
      navigate(`/game/${id}`);
    });
  }, [categoryIdInt, dispatch, navigate, selected, versions]);

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
            {Object.keys(algosByUser).map((userId) => (
              <OpponentCard
                key={userId}
                userId={userId}
                selectedAlgos={selected}
                onSelectAlgoVersion={handleSelectFile}
              />
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
