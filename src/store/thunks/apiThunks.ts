import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AsyncThunk } from '@reduxjs/toolkit/src/createAsyncThunk';
import type { ResultType } from '../../api/makeRequest';
import makeRequest from '../../api/makeRequest';
import type ApiRequests from '../../api/methods';
import type { AppDispatch, AppThunkApi } from '../index';

export const apiThunk = createAsyncThunk<
ResultType<ApiRequests>,
ApiRequests,
AppThunkApi
>(
  'api/makeRequest',
  (request) => {
    return makeRequest(request);
  },
);

export function api<T extends ApiRequests>(dispatch: AppDispatch, request: T) {
  return dispatch((apiThunk as unknown as AsyncThunk<ResultType<T>, T, AppThunkApi>)(request)).unwrap();
}
