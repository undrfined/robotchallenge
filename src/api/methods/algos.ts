import { PostFileRequest, GetRequest, RequestType } from './types';

export class PostAlgo extends PostFileRequest implements RequestType {
  type = 'algos';

  resultType?: { id: number };
}

export class GetAlgos extends GetRequest implements RequestType {
  type = 'algos';

  resultType?: {
    file: number[];
    id: number;
    userId: string;
  }[];
}

type AlgosRequests = PostAlgo | GetAlgos;
export default AlgosRequests;
