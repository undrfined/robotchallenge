import {
  PostFileRequest, GetRequest, RequestType, GetFileRequest,
} from './types';
import { ApiAlgo, ApiAlgoVersion } from '../types';

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

type AlgosRequests = PostAlgo | GetAlgos | GetAlgoFile | GetAlgoVersions;
export default AlgosRequests;
