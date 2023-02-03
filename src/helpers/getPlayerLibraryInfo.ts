import * as Comlink from 'comlink';
import { GameLibraryInfo } from '../types/gameTypes';
import { PlayerWorkerType } from '../workers/player.worker';

export default async function getPlayerLibraryInfo(blob: Blob): Promise<GameLibraryInfo> {
  const worker = new Worker(new URL('../workers/player.worker.ts', import.meta.url));
  const comlink = Comlink.wrap<PlayerWorkerType>(worker);

  await comlink.initWasi(blob,
    Comlink.proxy(() => {
    }),
    Comlink.proxy(() => {
    }),
    Comlink.proxy(() => {
    }),
    Comlink.proxy(() => {
    }));

  const info = await comlink.getLibraryInfo();

  worker.terminate();

  return info;
}
