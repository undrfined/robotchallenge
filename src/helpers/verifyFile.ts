import getPlayerLibraryInfo from './getPlayerLibraryInfo';

export default async function verifyFile(file?: Blob) {
  if (!file) return undefined;

  try {
    const info = await getPlayerLibraryInfo(file);

    return {
      file,
      info,
    };
  } catch (err) {
    return undefined;
  }
}
