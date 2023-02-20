import { GetRequest, RequestType } from './types';

export class AuthRequest extends GetRequest implements RequestType {
  type = 'auth';

  resultType?: { redirectUrl: string };
}

export class LogOutRequest extends GetRequest implements RequestType {
  type = 'logout';

  resultType?: undefined;
}

type AuthRequests = AuthRequest | LogOutRequest;
export default AuthRequests;
