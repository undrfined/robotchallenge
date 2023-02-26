import { GetRequest, PostRequest, RequestType } from './types';
import { ApiNewUserGroup, ApiUser, ApiUserGroup } from '../types';

const BASE = 'userGroups';
export class GetUserGroups extends GetRequest implements RequestType {
  type = BASE;

  resultType?: ApiUserGroup[];
}

export class PostUserGroup extends PostRequest implements RequestType {
  type = BASE;

  constructor(public newUserGroup: ApiNewUserGroup) {
    super();
  }

  resultType?: ApiUserGroup;
}

export class AttachToUserGroup extends GetRequest implements RequestType {
  type = `${BASE}/attach`;

  constructor(public userGroupId: number) {
    super();
    this.path = [userGroupId];
  }

  resultType?: ApiUser;
}

type UserGroupRequests = GetUserGroups | PostUserGroup | AttachToUserGroup;
export default UserGroupRequests;
