import type { RequestType } from './types';
import { GetRequest } from './types';

const BASE = 'auth';

export class AuthRequest extends GetRequest implements RequestType {
  type = `${BASE}/login`;

  resultType?: { redirectUrl: string };
}

export class LogOutRequest extends GetRequest implements RequestType {
  type = `${BASE}/logout`;

  resultType?: undefined;
}

type AuthRequests = AuthRequest | LogOutRequest;
export default AuthRequests;
