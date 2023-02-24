import {
  PostFileRequest, GetRequest, RequestType, GetFileRequest,
} from './types';
import { ApiAlgo } from '../types';

const BASE = 'algos';

export class PostAlgo extends PostFileRequest implements RequestType {
  type = BASE;

  resultType?: { id: number };
}

export class GetAlgos extends GetRequest implements RequestType {
  type = BASE;

  resultType?: ApiAlgo[];
}

export class GetAlgoFile extends GetFileRequest implements RequestType {
  type = BASE;

  constructor(public id?: number) {
    super();
    this.path = [id];
  }
}

type AlgosRequests = PostAlgo | GetAlgos | GetAlgoFile;
export default AlgosRequests;
