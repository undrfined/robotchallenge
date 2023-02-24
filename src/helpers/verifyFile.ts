import getPlayerLibraryInfo from './getPlayerLibraryInfo';
import { ApiAlgo } from '../api/types';

export default async function verifyFile(blob?: Blob): Promise<Omit<ApiAlgo, 'id' | 'userId'> | undefined> {
  if (!blob) return undefined;

  try {
    const info = await getPlayerLibraryInfo(blob);

    return {
      // TODO wow this is bad
      file: await fetch(URL.createObjectURL(blob))
        .then((res) => res.arrayBuffer()).then((buf) => Array.from(new Uint8Array(buf))),
      name: info.name,
      version: info.version,
      language: info.language,
    };
  } catch (err) {
    return undefined;
  }
}
