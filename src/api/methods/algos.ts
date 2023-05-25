import type { RequestType } from './types';
import {
  PostFileRequest, GetRequest, GetFileRequest, PostRequest,
} from './types';
import type { ApiAlgo, ApiAlgoVersion } from '../types';
import type { GameLibraryInfo } from '../../types/gameTypes';

const BASE = 'algos';

export class PostAlgo extends PostFileRequest implements RequestType {
  type = BASE;

  resultType?: { algoId: number, algoVersionId: number };
}

export class GetAlgos extends GetRequest implements RequestType {
  type = BASE;

  resultType?: ApiAlgo[];
}

export class GetAlgoVersions extends GetRequest implements RequestType {
  type = BASE;

  constructor(public id?: number) {
    super();
    this.path = [id];
  }

  resultType?: ApiAlgoVersion[];
}

export class GetAlgoFile extends GetFileRequest implements RequestType {
  type = `${BASE}/file`;

  constructor(public id?: number) {
    super();
    this.path = [id];
  }
}

export class Run extends PostRequest implements RequestType {
  type = `${BASE}/run`;

  constructor(public payload: { algoVersions: number[] }) {
    super();
  }

  resultType?: GameLibraryInfo[];
}

type AlgosRequests = PostAlgo | GetAlgos | GetAlgoFile | GetAlgoVersions | Run;
export default AlgosRequests;
