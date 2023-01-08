import React, {
  useCallback, useEffect, useState,
} from 'react';
import './App.css';
import * as Comlink from 'comlink';
import wasm from './test_rust.wasm';
import GamePage from './components/pages/GamePage/GamePage';
import { CoreWorkerType } from './workers/core.worker';
import { GameConfig, GameMap, GamePlayerActions } from './types/gameTypes';

const coreWorker = new Worker(new URL('./workers/core.worker.ts', import.meta.url));
const Core = Comlink.wrap<CoreWorkerType>(coreWorker);

export type MapState = {
  map: GameMap;
  playerActions: GamePlayerActions[];
};

function App() {
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [mapStates, setMapStates] = useState<MapState[]>([]);
  const [roundNumber, setRoundNumber] = useState(0);

  const gameConfig: GameConfig = {
    width: 32,
    height: 32,
    roundsCount: 10,
    playersCount: 2,
    initialRobotsCount: 10,
    startEnergy: 100,
    rngSeed: 123,
    energyStationsPerRobot: 10,
    energyLossToCloneRobot: 10,
    maxRobotsCount: 100,
    timeout: 10,
    energyCollectDistance: 2,
  };

  // useEffect(() => {
  //   if (isFinished && changes.length) {
  //     // console.log('done!');
  //     setTimeout(showNextChange, 1500);
  //   }
  // }, [changes.length, isFinished, showNextChange]);

  const start = useCallback(() => {
    (async () => {
      await Core.initCore();

      const algos = [
        await fetch(wasm).then((l) => l.blob()),
        await fetch(wasm).then((l) => l.blob()),
      ];
      await Core.initGame(gameConfig, algos);
      setMapStates([{
        map: await Core.getMap(),
        playerActions: [],
      }]);
      setIsStarted(true);
    })();
  }, [gameConfig]);

  useEffect(() => {
    Core.setCallbacks(Comlink.proxy(async (gameMap: GameMap, playerActions: GamePlayerActions[]) => {
      setRoundNumber((no) => no + 1);
      setMapStates((states) => {
        const other = states.slice(0, -1);
        const last = states[states.length - 1];

        return [...other, {
          ...last,
          playerActions,
        }, {
          map: gameMap,
          playerActions: [],
        }];
      });

      setIsWatching(false);
    }));
  }, [roundNumber]);

  useEffect(() => {
    if (isStarted) {
      (async () => {
        await Core.get_player_actions(roundNumber - 1);
      })();
    }

    if (roundNumber === gameConfig.roundsCount) {
      setIsGameFinished(true);
    }
  }, [roundNumber, gameConfig.roundsCount]);

  // const [files, setFiles] = useState<File[]>([]);

  // const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (!file) return;
  //
  //   setFiles([...files, file]);
  //   // console.log('new files!', file)
  //   e.currentTarget.value = '';
  // };

  useEffect(() => {
    if (!isStarted) {
      start();
    }
  }, []);

  const watch = async () => {
    if (isWatching) return;

    setIsWatching(true);
    await Core.doRound();
  };

  return (
    <div className="App">
      {/* <SelectGamePage/> */}
      {/* {formatBytes(window.performance.memory.usedJSHeapSize)
      + '/' + formatBytes(window.performance.memory.jsHeapSizeLimit)} */}

      {isGameFinished && <div>Game finished!</div>}
      {mapStates?.length && (
        <GamePage
          mapStates={mapStates}
          gameConfig={gameConfig}
          roundNumber={roundNumber}
          onChangeRoundNumber={setRoundNumber}
          onTogglePause={watch}
          isPaused={!isWatching}
        />
      )}

      {/* <input type="file" accept="application/wasm" onChange={handleChange}/> */}
      {/* {files.map(file => { */}
      {/*  return <div>{file.name} ({formatBytes(file.size)})</div> */}
      {/* })} */}
    </div>
  );
}

export default App;
