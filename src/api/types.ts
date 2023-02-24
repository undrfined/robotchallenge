import { GameConfig } from '../types/gameTypes';
import { LottieIcon } from '../helpers/lottieIcons';

export type ApiUser = {
  avatarUrl: string;
  id: string;
  name: string;
  role: 'user' | 'admin';
};

export type ApiCategory = {
  id: number;
  name: string;
  description: string;
  descriptionShort: string;
  maxPoints: number;
  gameConfig: GameConfig;
  icon: LottieIcon;
  createdAt: string;
  updatedAt: string;
};

export type ApiAlgo = {
  id: number;
  userId: string;
  version: string,
  name: string,
  language: string,
};

export type ApiAlgoWithFile = ApiAlgo & {
  file?: Blob;
};
