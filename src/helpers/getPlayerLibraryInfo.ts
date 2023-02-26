import * as Comlink from 'comlink';
import type { GameLibraryInfo } from '../types/gameTypes';
import type { PlayerWorkerType } from '../workers/player.worker';

export default async function getPlayerLibraryInfo(blob: Blob): Promise<GameLibraryInfo> {
  const worker = new Worker(new URL('../workers/player.worker.ts', import.meta.url));
  const comlink = Comlink.wrap<PlayerWorkerType>(worker);

  await comlink.initWasi(blob,
    Comlink.proxy(() => {
      return 1;
    }),
    Comlink.proxy(() => {
      return 1;
    }),
    Comlink.proxy(() => {
      return 1;
    }),
    Comlink.proxy(() => {
    }));

  const info = await comlink.getLibraryInfo();

  worker.terminate();

  return info;
}
