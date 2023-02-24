import getPlayerLibraryInfo from './getPlayerLibraryInfo';
import { ApiAlgoWithFile } from '../api/types';

export default async function verifyFile(file?: Blob): Promise<Omit<ApiAlgoWithFile, 'id' | 'userId'> | undefined> {
  if (!file) return undefined;

  try {
    const info = await getPlayerLibraryInfo(file);

    return {
      file,
      name: info.name,
      version: info.version,
      language: info.language,
    };
  } catch (err) {
    return undefined;
  }
}
