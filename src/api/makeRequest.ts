import Requests from './methods/index';
import { GetRequest, PostRequest } from './methods/types';
import { compact } from '../helpers/iteratees';

const ENDPOINT = `${window.location.protocol}//${process.env.APP_API_ENDPOINT}`;

export default function makeRequest<T extends Requests>(request: T): Promise<ResultType<T>> {
  const formData = new FormData();

  if (request instanceof PostRequest) {
    formData.append('file', request.body);
  }

  let url = ENDPOINT + request.type;
  if (request instanceof GetRequest) {
    const joinedPath = compact(request.path).join('/');
    url += joinedPath ? `/${joinedPath}` : '';
    console.log('get', request, url);
  }

  return fetch(url, {
    method: request.method,
    credentials: 'include',
    body: request instanceof PostRequest ? formData : undefined,
  }).then((response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return response.json() as unknown as ResultType<T>;
  });
}

export type ResultType<T extends Requests> = NonNullable<T['resultType']>;
