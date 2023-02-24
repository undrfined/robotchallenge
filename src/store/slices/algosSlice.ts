import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { AppThunkApi } from '../index';
import makeRequest from '../../api/makeRequest';
import { GetAlgos, PostAlgo } from '../../api/methods/algos';
import { ApiAlgo } from '../../api/types';
import getPlayerLibraryInfo from '../../helpers/getPlayerLibraryInfo';

type AlgosState = {
  algos: ApiAlgo[];
};

const initialState: AlgosState = {
  algos: [],
};

export const fetchAlgos = createAsyncThunk<
ApiAlgo[],
void,
AppThunkApi
>(
  'algos/fetchAlgos',
  () => {
    return makeRequest(new GetAlgos());
  },
);

export const uploadAlgo = createAsyncThunk<
ApiAlgo,
number[],
AppThunkApi
>(
  'algos/uploadAlgo',
  async (data, { getState }) => {
    const currentUser = getState().auth.user;
    if (!currentUser) throw new Error('User is not logged in');

    // TODO Real bad
    const blob = new Blob([new Uint8Array(data)], { type: 'application/wasm' });
    const libInfo = await getPlayerLibraryInfo(blob);
    const result = await makeRequest(new PostAlgo(blob));

    return {
      id: result.id,
      userId: currentUser.id,
      file: data,
      name: libInfo.name,
      version: libInfo.version,
      language: libInfo.language,
    };
  },
);

export const algosReducer = createSlice({
  name: 'algos',
  initialState,
  reducers: {

  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlgos.pending, () => {
        // state.isLoggingIn = true;
      })
      .addCase(fetchAlgos.rejected, () => {
        // state.isLoggingIn = false;
      })
      .addCase(fetchAlgos.fulfilled, (state, action) => {
        state.algos = action.payload;
      });

    builder
      .addCase(uploadAlgo.fulfilled, (state, action) => {
        state.algos.push(action.payload);
      });
  },
});

export default algosReducer.reducer;
