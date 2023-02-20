import { GetRequest, RequestType } from './types';

export class GetUserRequest extends GetRequest implements RequestType {
  type = 'user';

  resultType?: { avatarUrl: string; id: string; };
}

type UsersRequests = GetUserRequest;
export default UsersRequests;
