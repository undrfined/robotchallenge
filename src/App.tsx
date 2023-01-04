import React, {
  useCallback, useEffect, useState,
} from 'react';
import './App.css';
import * as Comlink from 'comlink';
import wasm from './test_rust.wasm';
import GamePage from './components/pages/GamePage/GamePage';
import { CoreWorkerType } from './workers/core.worker';
import { GameConfig, GameMap } from './types/gameTypes';

const coreWorker = new Worker(new URL('./workers/core.worker.ts', import.meta.url));
const Core = Comlink.wrap<CoreWorkerType>(coreWorker);

function App() {
  const [isFinished, setIsFinished] = useState(true);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [map, setMap] = useState<GameMap>();
  const [changes] = useState<GameMap[]>([]);
  const [diff] = useState(0);
  const [roundNumber, setRoundNumber] = useState(0);

  const gameConfig: GameConfig = {
    width: 32,
    height: 32,
    roundsCount: 10,
    playersCount: 2,
    initialRobotsCount: 10,
    startEnergy: 100,
    rngSeed: 123,
    energyStationsPerRobot: 1,
    energyLossToCloneRobot: 10,
    maxRobotsCount: 100,
    timeout: 10,
  };

  const showNextChange = useCallback(() => {
    // const a = changes.shift();
    // setChanges(changes);

    // console.log(a);

    // if (a) {
    //   if (map) {
    //     const diff = a.robots.findIndex((robot, i) => robot.position.x !== map.robots[i]
    //     .position.x
    //     || robot.position.y !== map.robots[i].position.y);
    //     if (diff !== -1) {
    //       setDiff(diff);
    //       // console.log(diff, a, map);
    //     }
    //     setMap(a);
    //   }
    // }
  }, [changes, map]);

  useEffect(() => {
    if (isFinished && changes.length) {
      // console.log('done!');
      setTimeout(showNextChange, 1500);
    }
  }, [changes.length, isFinished, showNextChange]);

  const start = useCallback(() => {
    (async () => {
      await Core.initCore(Comlink.proxy((gameMap: GameMap) => {
        // console.log('wow');
        setMap(gameMap);
        // setChanges((c) => [...c, gameMap]);
      }), Comlink.proxy(async () => {
        // console.log('finished!');
        setRoundNumber((no) => no + 1);

        Core.test();

        setIsFinished(true);
        setIsWatching(false);
        // if(!isWatching) {
        //   setMap(await Core.getMap());
        // }
      }));

      const algos = [
        await fetch(wasm).then((l) => l.blob()),
        await fetch(wasm).then((l) => l.blob()),
      ];
      await Core.initGame(gameConfig, algos);
      setMap(await Core.getMap());
      setIsStarted(true);
    })();
  }, [gameConfig]);

  useEffect(() => {
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

  // const wow = async () => {
  //   if (!isStarted) {
  //     start();
  //     return;
  //   }
  //   setIsFinished(false);
  //   await Core.doRound();
  // };

  const watch = async () => {
    if (isWatching) return;

    setIsFinished(false);
    setIsWatching(true);
    await Core.doRound();
  };

  return (
    <div className="App">
      {/* <SelectGamePage/> */}
      {/* {formatBytes(window.performance.memory.usedJSHeapSize)
      + '/' + formatBytes(window.performance.memory.jsHeapSizeLimit)} */}

      {isGameFinished && <div>Game finished!</div>}
      {map && (
        <GamePage
          map={map}
          gameConfig={gameConfig}
          diff={diff}
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
