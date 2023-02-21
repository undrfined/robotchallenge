import { GameLibraryInfo } from '../types/gameTypes';

export type ApiUser = {
  avatarUrl: string;
  id: string;
  name: string;
  role: 'user' | 'admin';
};

export type ApiAlgo = {
  id: number;
  userId: string;
  file: Blob;
  info?: GameLibraryInfo;
};
