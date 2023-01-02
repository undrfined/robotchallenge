import React, {useCallback, useEffect, useRef, useState} from 'react';
import './App.css';
import * as Comlink from 'comlink';
import wasm from './test_rust.wasm';
import GamePage from "./components/pages/GamePage/GamePage";
import {CoreWorkerType} from "./core.worker";
import Button from "./components/common/Button/Button";
import {GameConfig, GameMap} from "./types/gameTypes";

const coreWorker = new Worker(new URL('./core.worker.ts', import.meta.url));
const Core = Comlink.wrap<CoreWorkerType>(coreWorker);

function App() {
  const [isFinished, setIsFinished] = useState(true);
  const [isWatching, setIsWatching] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [map, setMap] = useState<GameMap>()
  const [changes, setChanges] = useState<GameMap[]>([]);
  const [diff, setDiff] = useState(0);

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
  };

  const showNextChange = useCallback(() => {
    const a = changes.shift();
    setChanges(changes);

    // console.log(a);


    if(!a) {
      return;
    }
    else if(map) {
      const diff = a.robots.findIndex((robot, i) => robot.position.x !== map.robots[i].position.x || robot.position.y !== map.robots[i].position.y);
        if(diff !== -1) {
          setDiff(diff);
          // console.log(diff, a, map);
        }
      setMap(a);
    }
  }, [changes, map]);

  useEffect(() => {
    if(isFinished && changes.length) {
      // console.log('done!');
      setTimeout(showNextChange, 1500);
    }
  }, [changes.length, isFinished, showNextChange])

  const start = useCallback(() => {
    (async () => {
      await Core.initCore(Comlink.proxy((map: GameMap) => {
        // console.log('wow');
        setChanges((c) => {
          return [...c, map];
        });
      }), Comlink.proxy(async () => {
        // console.log('finished!');
        setIsFinished(true);
        // if(!isWatching) {
        //   setMap(await Core.getMap());
        // }
      }));

      const algos = [
        await fetch(wasm).then(l => l.blob()),
        await fetch(wasm).then(l => l.blob()),
      ];
      await Core.initGame(gameConfig, algos);
      setMap(await Core.getMap());
      setIsStarted(true);
    })()
  }, [gameConfig])

  const [files, setFiles] = useState<File[]>([]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(!file) return;

    setFiles([...files, file]);
    // console.log('new files!', file)
    e.currentTarget.value = '';
  }

  const wow = async () => {
    if(!isStarted) {
      start();
      return;
    }
    setIsFinished(false);
    await Core.doRound();
  }

  const watch = async () => {
    setIsFinished(false);
    setIsWatching(true);
    await Core.doRound();
  }

  return (
    <div className="App">
      {/*<SelectGamePage/>*/}
      {/*{formatBytes(window.performance.memory.usedJSHeapSize) + '/' + formatBytes(window.performance.memory.jsHeapSizeLimit)}*/}

      <Button onClick={watch} disabled={!isFinished}>Watch</Button>
      <Button onClick={wow} disabled={!isFinished}>{isStarted ? 'Step' : 'Start'}</Button>
      {map && <GamePage map={map} gameConfig={gameConfig} diff={diff}/>}

      {/*<input type="file" accept="application/wasm" onChange={handleChange}/>*/}
      {/*{files.map(file => {*/}
      {/*  return <div>{file.name} ({formatBytes(file.size)})</div>*/}
      {/*})}*/}
    </div>
  );
}

export default App;
