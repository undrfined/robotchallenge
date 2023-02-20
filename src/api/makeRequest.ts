import Requests from './methods/index';

const ENDPOINT = `${window.location.protocol}//${process.env.APP_API_ENDPOINT}`;

export default function makeRequest<T extends Requests>(request: T): Promise<ResultType<T>> {
  return fetch(ENDPOINT + request.type, {
    method: request.method,
    credentials: 'include',
  }).then((response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return response.json() as unknown as ResultType<T>;
  });
}

export type ResultType<T extends Requests> = NonNullable<T['resultType']>;
