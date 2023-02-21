import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage';
import { persistReducer } from 'redux-persist';
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
  async () => {
    const result = await makeRequest(new GetAlgos());

    return Promise.all(result.map(async (algo) => {
      const blob = new Blob([new Uint8Array(algo.file)], { type: 'application/wasm' });
      return {
        id: algo.id,
        userId: algo.userId,
        file: blob,
        info: await getPlayerLibraryInfo(blob),
      };
    }));
  },
);

export const uploadAlgo = createAsyncThunk<
ApiAlgo,
Blob,
AppThunkApi
>(
  'algos/uploadAlgo',
  async (blob, { getState }) => {
    const currentUser = getState().auth.user;
    if (!currentUser) throw new Error('User is not logged in');

    const result = await makeRequest(new PostAlgo(blob));

    return {
      id: result.id,
      userId: currentUser.id,
      file: blob,
      info: await getPlayerLibraryInfo(blob),
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

const persistConfig = {
  key: 'algos',
  storage,
};

export default persistReducer(persistConfig, algosReducer.reducer);
