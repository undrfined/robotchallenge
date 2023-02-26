import type { GameConfig } from '../types/gameTypes';
import type { LottieIcon } from '../helpers/lottieIcons';

export type ApiUser = {
  avatarUrl: string;
  id: string;
  name: string;
  role: 'user' | 'admin';
  userGroupId?: number;
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

export type ApiNewUserGroup = {
  name: string;
};

export type ApiUserGroup = ApiNewUserGroup & {
  id: number;
  createdAt: string;
  updatedAt: string;
};

export type ApiAlgoId = number;
export type ApiAlgoVersionId = number;

export type ApiAlgo = {
  id: ApiAlgoId;
  userId: string;
  name: string,
  language: string,
};

export type ApiAlgoVersion = {
  id: ApiAlgoVersionId;
  algoId: ApiAlgoId;
  version: string;
};

export type ApiAlgoVersionWithFile = ApiAlgoVersion & {
  file?: Blob;
};
