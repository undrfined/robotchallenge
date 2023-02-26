import type Requests from './methods/index';
import {
  GetFileRequest, GetRequest, PostFileRequest, PostRequest,
} from './methods/types';
import { compact, omit } from '../helpers/iteratees';
import { nullsToUndefined } from '../helpers/nullsToUndefined';

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

  let url = `${ENDPOINT + request.type}/`;
  if (request instanceof GetRequest || request instanceof GetFileRequest) {
    const joinedPath = compact(request.path).join('/');
    url += joinedPath || '';
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
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }

    if (request instanceof GetFileRequest) {
      return await response.blob() as unknown as ResultType<T>;
    }
    return nullsToUndefined(await response.json()) as unknown as ResultType<T>;
  });
}

export type ResultType<T extends Requests> = NonNullable<T['resultType']>;
export type ParamsType<T extends Requests> = {
  [K in Exclude<keyof T, 'type' | 'method' | 'resultType' | undefined>]: T[K]
};
