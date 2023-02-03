import getPlayerLibraryInfo from './getPlayerLibraryInfo';

export default async function verifyFile(f?: Blob) {
  if (!f) return undefined;

  try {
    const info = await getPlayerLibraryInfo(f);

    return {
      info,
      file: f,
    };
  } catch (err) {
    return undefined;
  }
}
