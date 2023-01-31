import React, {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import './App.css';
import * as Comlink from 'comlink';
import wasm from './test_rust.wasm';
import GamePage from './components/pages/GamePage/GamePage';
import { CoreWorkerType } from './workers/core.worker';
import { GameConfig, GameMap, GamePlayerActions } from './types/gameTypes';
import formatBytes from './helpers/formatBytes';

const coreWorker = new Worker(new URL('./workers/core.worker.ts', import.meta.url));
const Core = Comlink.wrap<CoreWorkerType>(coreWorker);

export type MapState = {
  map: GameMap;
  playerActions: GamePlayerActions[];
};

let k = false;
function App() {
  const [isStarted, setIsStarted] = useState(false);
  const [mapStates, setMapStates] = useState<MapState[]>([]);
  const [roundNumber, setRoundNumber] = useState(0);
  const [logs, setLogs] = useState<Record<number, {
    log: string,
    errorLog: string,
  }>>({});

  const gameConfig = useMemo((): GameConfig => ({
    width: 16,
    roundsCount: 50,
    playersCount: 2,
    initialRobotsCount: 1,
    startEnergy: 1000000,
    rngSeed: 123,
    energyStationsPerRobot: 1,
    energyLossToCloneRobot: 1,
    maxRobotsCount: 10000,
    timeout: 100,
    maxTimeoutsCount: 5,
    energyCollectDistance: 2,
  }), []);

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
      // setRoundNumber((no) => no + 1);
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
    }),
    Comlink.proxy((owner: number, log: string, errorLog: string) => {
      setLogs((oldLogs) => ({
        ...oldLogs,
        [owner]: {
          log: (oldLogs[owner]?.log || '') + log,
          errorLog: (oldLogs[owner]?.errorLog || '') + errorLog,
        },
      }));
    }));
  }, [roundNumber]);

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
    if (!isStarted && !k) {
      k = true;
      start();
      setInterval(() => {
        document.title = (`${formatBytes(window.performance.memory.usedJSHeapSize)
        }/${formatBytes(window.performance.memory.jsHeapSizeLimit)}`);
      }, 1000);
    }
  }, [isStarted, start]);

  useEffect(() => {
    if (!isStarted) return;
    if (mapStates.length <= gameConfig.roundsCount) {
      Core.doRound();
    }
  }, [gameConfig.roundsCount, isStarted, mapStates]);

  return (
    <div className="App">
      {/* <SelectGamePage/> */}

      {mapStates?.length && (
        <GamePage
          mapStates={mapStates}
          gameConfig={gameConfig}
          roundNumber={roundNumber}
          onChangeRoundNumber={setRoundNumber}
          logs={logs}
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
