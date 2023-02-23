import { PostFileRequest, GetRequest, RequestType } from './types';

const BASE = 'algos';

export class PostAlgo extends PostFileRequest implements RequestType {
  type = BASE;

  resultType?: { id: number };
}

export class GetAlgos extends GetRequest implements RequestType {
  type = BASE;

  resultType?: {
    file: number[];
    id: number;
    userId: string;
  }[];
}

type AlgosRequests = PostAlgo | GetAlgos;
export default AlgosRequests;
