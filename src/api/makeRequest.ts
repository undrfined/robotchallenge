import Requests from './methods/index';
import { GetRequest, PostFileRequest, PostRequest } from './methods/types';
import { compact, omit } from '../helpers/iteratees';

const ENDPOINT = `${window.location.protocol}//${process.env.APP_API_ENDPOINT}`;

export default function makeRequest<T extends Requests>(request: T): Promise<ResultType<T>> {
  const formData = new FormData();
  let formDataJson: string | undefined;

  if (request instanceof PostFileRequest) {
    formData.append('file', request.body);
  }

  if (request instanceof PostRequest) {
    const properties = Object.getOwnPropertyNames(request)
    // @ts-ignore
      .reduce((acc, key) => ({ ...acc, [key]: request[key] }), {} as Record<string, any>);
    const propertiesFiltered = omit(properties, ['type', 'method', 'resultType']);
    formDataJson = JSON.stringify(Object.values(propertiesFiltered)[0]);
  }

  let url = ENDPOINT + request.type;
  if (request instanceof GetRequest) {
    const joinedPath = compact(request.path).join('/');
    url += joinedPath ? `/${joinedPath}` : '';
  }

  return fetch(url, {
    method: request.method,
    credentials: 'include',
    ...(request instanceof PostRequest && {
      headers: {
        'Content-Type': 'application/json',
      },
    }),
    body: request instanceof PostFileRequest ? formData : (
      request instanceof PostRequest ? formDataJson : undefined
    ),
  }).then((response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return response.json() as unknown as ResultType<T>;
  });
}

export type ResultType<T extends Requests> = NonNullable<T['resultType']>;
export type ParamsType<T extends Requests> = {
  [K in Exclude<keyof T, 'type' | 'method' | 'resultType' | undefined>]: T[K]
};
