import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './GameInfoPage.module.scss';
import useAppSelector from '../../../hooks/useAppSelector';
import useAppDispatch from '../../../hooks/useAppDispatch';
import { GameId, startGame } from '../../../store/slices/gamesSlice';
import wasm from '../../../test_rust.wasm';
import wasmCsharp from '../../../lol.wasm';
import { selectGames } from '../../../store/selectors/gamesSelectors';
import { CategoryId } from '../../../store/slices/categoriesSlice';
import { selectCategory } from '../../../store/selectors/categoriesSelectors';
import Back from '../../../assets/icons/Back.svg';
import UploadFile from '../../common/UploadFile/UploadFile';
import Button from '../../common/Button/Button';
import verifyFile from '../../../helpers/verifyFile';
import { GameLibraryInfo } from '../../../types/gameTypes';
import { isTruthy } from '../../../helpers/isTruthy';
import AnimatedText from '../../common/AnimatedText/AnimatedText';
import Checkbox from '../../common/Checkbox/Checkbox';
import Avatar from '../../common/Avatar/Avatar';
import Version from '../../../assets/icons/Version.svg';
import Code from '../../../assets/icons/Code.svg';
import Dropdown from '../../../assets/icons/Dropdown.svg';

let k = false;
export default function GameInfoPage() {
  const { categoryId } = useParams() as { categoryId: CategoryId };
  const category = useAppSelector(selectCategory(categoryId));
  if (!category) throw new Error('Category not found');

  const { isLoading } = useAppSelector(selectGames);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [files, setFiles] = useState<{ file: Blob, info: GameLibraryInfo }[]>([]);
  const [file, setFile] = useState<{ file: Blob, info: GameLibraryInfo } | undefined>();
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    (async () => {
      if (k) return;
      k = true;
      setFiles([
        await verifyFile(await fetch(wasm).then((l) => l.blob())),
        await verifyFile(await fetch(wasmCsharp).then((l) => l.blob())),
      ].filter(isTruthy));
    })();
  }, []);

  const handleStartGame = useCallback(() => {
    const selectedFiles = selected.map((l) => files[l]);
    const algos = [...selectedFiles, file].filter(isTruthy);
    dispatch(startGame({
      algos: algos.map((l) => l.file),
      gameConfig: {
        width: 16,
        roundsCount: 50,
        playersCount: algos.length,
        initialRobotsCount: 1,
        startEnergy: 50,
        rngSeed: 123,
        energyStationsPerRobot: 1,
        energyLossToCloneRobot: 10,
        maxRobotsCount: 50,
        timeout: 1000,
        maxTimeoutsCount: 5,
        energyCollectDistance: 2,
      },
    })).then((a) => {
      // TODO types?
      const { id } = a.payload as { id: GameId };
      navigate(`/game/${id}`);
    });
  }, [dispatch, file, files, navigate, selected]);

  return (
    <div className={styles.root}>
      <div className={styles.info}>
        <h1>
          <Back onClick={() => navigate('/')} className={styles.closeButton} />
          <AnimatedText text={category.title} containerType="span" delay={0} />
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
            {files.map((l, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <div className={styles.opponent} key={i}>
                <Avatar avatar="https://i.pravatar.cc/300" size="small" />
                <div className={styles.opponentName}>{l.info.language}</div>

                <div className={styles.dropdown}>
                  <Version />
                  <div className={styles.dropdownName}>
                    Version
                  </div>
                  <div className={styles.dropdownContent}>
                    {l.info.version}
                  </div>
                  <Dropdown />
                </div>

                <div className={styles.dropdown}>
                  <Code />
                  <div className={styles.dropdownName}>
                    Algorithm
                  </div>
                  <div className={styles.dropdownContent}>
                    {l.info.name}
                  </div>
                  <Dropdown />
                </div>

                <div className={styles.opponentVersion}>{l.info.version}</div>
                <Checkbox
                  checked={selected.includes(i)}
                  className={styles.checkbox}
                  onToggle={(checked) => {
                    setSelected(checked ? [...selected, i] : selected.filter((q) => q !== i));
                  }}
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
          setFile={setFile}
        />

        <Button onClick={handleStartGame}>
          {isLoading ? 'loading...' : 'START'}
        </Button>
      </div>
    </div>
  );
}
