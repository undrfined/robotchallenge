import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import cn from 'classnames';
import styles from './GameInfoPage.module.scss';
import useAppSelector from '../../../hooks/useAppSelector';
import useAppDispatch from '../../../hooks/useAppDispatch';
import { selectIsGameLoading } from '../../../store/selectors/gamesSelectors';
import { selectCategory } from '../../../store/selectors/categoriesSelectors';
import Back from '../../../assets/icons/Back.svg';
import UploadFile from '../../common/UploadFile/UploadFile';
import Button from '../../common/Button/Button';
import AnimatedText from '../../common/AnimatedText/AnimatedText';
import { fetchAlgoFile, fetchAlgos, uploadAlgo } from '../../../store/slices/algosSlice';
import OpponentCard from '../../common/OpponentCard/OpponentCard';
import type { GameLibraryInfo } from '../../../types/gameTypes';
import type { ApiAlgoId, ApiAlgoVersionId } from '../../../api/types';
import { isTruthy } from '../../../helpers/isTruthy';
import { startGame } from '../../../store/slices/gamesSlice';
import { LANGUAGES } from '../../../helpers/languages';
import useInterval from '../../../hooks/useInterval';
import { formatRemainingTime } from '../../../helpers/timeFormatters';

export default function GameInfoPage() {
  const { categoryId } = useParams() as { categoryId: string };
  const categoryIdInt = Number(categoryId);

  const category = useAppSelector(selectCategory(categoryIdInt));
  if (!category) throw new Error('Category not found');

  const isLoading = useAppSelector(selectIsGameLoading);
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

  const handleStartGame = useCallback(async () => {
    const selectedFiles = selected.map((l) => versions[l.algoId][l.algoVersionId]);
    const allAlgos = [...selectedFiles].filter(isTruthy); // TODO include current file

    const result = await dispatch(startGame({
      algoVersions: allAlgos,
      categoryId: categoryIdInt,
    }));

    if (result.payload) {
      const { id } = result.payload;
      navigate(`/game/${id}`);
    } else {
      // TODO better error message
      alert(`Error starting game ${result.error.message}`);
    }
  }, [categoryIdInt, dispatch, navigate, selected, versions]);

  const timeStart = category.deadlineAt ? Date.parse(`${category.deadlineAt}Z`) : undefined;
  const [timeRemaining, setTimeRemaining] = useState(timeStart ? timeStart - new Date().getTime() : undefined);

  useInterval(() => {
    if (timeStart === undefined) return;
    const now = new Date();

    setTimeRemaining(timeStart - now.getTime());
  }, timeStart ? 1000 : undefined);

  return (
    <div className={styles.root}>
      <div className={styles.info}>
        <h1>
          <Back onClick={() => navigate('/')} className={styles.closeButton} />
          <AnimatedText text={category.name} containerType="span" delay={0} />
        </h1>
        <AnimatedText text={category.description} containerType="p" delay={200} />

        {timeRemaining && timeStart && (
          <div className={styles.timer}>
            <h4>TIME REMAINING</h4>
            <div className={styles.timerRemaining}>
              {formatRemainingTime(Math.floor(timeRemaining / 1000)).map((q) => (
                <div key={q}>{q}</div>
              ))}
            </div>
          </div>
        )}

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
          <li>Pick the programming language of your choice below</li>
          <li>Create your algorithm and compile it to .wasm file using instructions in readme</li>
          <li>Upload your .wasm file</li>
          <li>Start the game!</li>
        </ol>

        <div className={styles.languages}>
          {Object.keys(LANGUAGES).map((languageKey, index) => {
            const { icon, name, isDisabled } = LANGUAGES[languageKey];
            const Icon = icon;
            return (
              <a
                href={`https://github.com/undrfined/robotchallenge/tree/master/examples/${languageKey}_example`}
                className={cn(styles.language, isDisabled && styles.languageDisabled)}
                style={{ '--index': index }}
                title={name}
              >
                <Icon />
              </a>
            );
          })}
        </div>

        <UploadFile
          accept="application/wasm"
          file={file}
          setFile={handleUploadFile}
        />

        <Button onClick={handleStartGame} isLoading={isLoading}>
          START
        </Button>
      </div>
    </div>
  );
}
