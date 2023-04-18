import * as Comlink from 'comlink';
import type { GameLibraryInfo } from '../types/gameTypes';
import type { PlayerWorkerType } from '../workers/player.worker';

export default async function getPlayerLibraryInfo(blob: Blob): Promise<GameLibraryInfo> {
  const worker = new Worker(new URL('../workers/player.worker.ts', import.meta.url));

  try {
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

    return await comlink.getLibraryInfo();
  } finally {
    worker.terminate();
  }
}
