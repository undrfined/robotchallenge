import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { AppThunkApi } from '../index';
import makeRequest from '../../api/makeRequest';
import { GetAlgoFile, GetAlgos, PostAlgo } from '../../api/methods/algos';
import { ApiAlgo, ApiAlgoWithFile } from '../../api/types';
import getPlayerLibraryInfo from '../../helpers/getPlayerLibraryInfo';

type Algo = ApiAlgoWithFile & {
  isLoading?: boolean
};
type AlgosState = {
  algos: Record<number, Algo>;
};

const initialState: AlgosState = {
  algos: {},
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

export const fetchAlgoFile = createAsyncThunk<
Blob,
number,
AppThunkApi
>(
  'algos/fetchAlgoFile',
  async (id) => {
    const result = await makeRequest(new GetAlgoFile(id));
    return new Blob([result], { type: 'application/wasm' });
  },
);

export const uploadAlgo = createAsyncThunk<
ApiAlgoWithFile,
Blob,
AppThunkApi
>(
  'algos/uploadAlgo',
  async (blob, { getState }) => {
    const currentUser = getState().auth.user;
    if (!currentUser) throw new Error('User is not logged in');

    const libInfo = await getPlayerLibraryInfo(blob);
    const result = await makeRequest(new PostAlgo(blob));

    return {
      id: result.id,
      userId: currentUser.id,
      file: blob,
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
        state.algos = action.payload.reduce((acc, algo) => {
          acc[algo.id] = algo;
          return acc;
        }, {} as Record<number, Algo>);
      });

    builder
      .addCase(uploadAlgo.fulfilled, (state, action) => {
        state.algos[action.payload.id] = action.payload;
      });

    builder
      .addCase(fetchAlgoFile.pending, (state, action) => {
        state.algos[action.meta.arg].isLoading = true;
      })
      .addCase(fetchAlgoFile.rejected, (state, action) => {
        state.algos[action.meta.arg].isLoading = false;
      })
      .addCase(fetchAlgoFile.fulfilled, (state, action) => {
        state.algos[action.meta.arg].file = action.payload;
        state.algos[action.meta.arg].isLoading = false;
      });
  },
});

export default algosReducer.reducer;
