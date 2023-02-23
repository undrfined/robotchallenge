import { GetRequest, RequestType } from './types';
import { ApiUser } from '../types';

const BASE = 'users';
export class GetUserRequest extends GetRequest implements RequestType {
  type = BASE;

  constructor(public id?: string) {
    super();
    this.path = [id];
  }

  resultType?: ApiUser;
}

type UsersRequests = GetUserRequest;
export default UsersRequests;
