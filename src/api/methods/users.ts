import { GetRequest, RequestType } from './types';
import { ApiUser } from '../types';

export class GetUserRequest extends GetRequest implements RequestType {
  type = 'user';

  constructor(public id?: string) {
    super();
    this.path = [id];
  }

  resultType?: ApiUser;
}

type UsersRequests = GetUserRequest;
export default UsersRequests;
