import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { AppThunkApi } from '../index';
import makeRequest from '../../api/makeRequest';
import {
  GetAlgoFile, GetAlgos, GetAlgoVersions, PostAlgo,
} from '../../api/methods/algos';
import {
  ApiAlgo, ApiAlgoId, ApiAlgoVersion, ApiAlgoVersionId, ApiAlgoVersionWithFile,
} from '../../api/types';
import getPlayerLibraryInfo from '../../helpers/getPlayerLibraryInfo';

export type AlgoVersion = ApiAlgoVersionWithFile & {
  isLoading?: boolean
};

type AlgosState = {
  algos: Record<string, Record<ApiAlgoId, ApiAlgo>>;
  algoVersions: Record<ApiAlgoId, Record<ApiAlgoVersionId, AlgoVersion>>;
};

const initialState: AlgosState = {
  algos: {},
  algoVersions: {},
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

export const fetchAlgoVersions = createAsyncThunk<
ApiAlgoVersion[],
ApiAlgoId,
AppThunkApi
>(
  'algos/fetchAlgoVersions',
  async (algoId) => {
    return makeRequest(new GetAlgoVersions(algoId));
  },
);

export const fetchAlgoFile = createAsyncThunk<
Blob,
{ algoId: ApiAlgoId, algoVersionId: ApiAlgoVersionId },
AppThunkApi
>(
  'algos/fetchAlgoFile',
  async ({ algoVersionId }) => {
    const result = await makeRequest(new GetAlgoFile(algoVersionId));
    return new Blob([result], { type: 'application/wasm' });
  },
);

export const uploadAlgo = createAsyncThunk<
{ algo: ApiAlgo, algoVersion: ApiAlgoVersionWithFile },
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
      algo: {
        id: result.algoId,
        userId: currentUser.id,
        name: libInfo.name,
        language: libInfo.language,
      },
      algoVersion: {
        id: result.algoVersionId,
        algoId: result.algoId,
        file: blob,
        version: libInfo.version,
      },
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
        action.payload.forEach((algo) => {
          state.algos[algo.userId] = {
            ...state.algos[algo.userId],
            [algo.id]: algo,
          };
          state.algoVersions[algo.id] = { ...state.algoVersions[algo.id] };
        });
      });

    builder
      .addCase(uploadAlgo.fulfilled, (state, action) => {
        state.algos[action.payload.algo.userId] = {
          ...state.algos[action.payload.algo.userId],
          [action.payload.algo.id]: action.payload.algo,
        };
        state.algoVersions[action.payload.algo.id] = {
          ...state.algoVersions[action.payload.algo.id],
          [action.payload.algoVersion.id]: action.payload.algoVersion,
        };
      });

    builder
      .addCase(fetchAlgoFile.pending, (state, action) => {
        const { algoId, algoVersionId } = action.meta.arg;
        if (!state.algoVersions[algoId][algoVersionId]) throw Error('Algo version is not loaded');
        if (state.algoVersions[algoId][algoVersionId]?.isLoading) throw Error('Algo is already loading');
        if (state.algoVersions[algoId][algoVersionId]?.file) throw Error('Algo file is already loaded');

        state.algoVersions[algoId][algoVersionId].isLoading = true;
      })
      .addCase(fetchAlgoFile.rejected, (state, action) => {
        const { algoId, algoVersionId } = action.meta.arg;

        state.algoVersions[algoId][algoVersionId].isLoading = false;
      })
      .addCase(fetchAlgoFile.fulfilled, (state, action) => {
        const { algoId, algoVersionId } = action.meta.arg;

        state.algoVersions[algoId][algoVersionId].file = action.payload;
        state.algoVersions[algoId][algoVersionId].isLoading = false;
      });

    builder
      .addCase(fetchAlgoVersions.fulfilled, (state, action) => {
        const algoId = action.meta.arg;

        state.algoVersions[algoId] = {
          ...state.algoVersions[algoId],
          ...action.payload.reduce((acc, algoVersion) => {
            acc[algoVersion.id] = algoVersion;
            return acc;
          }, {} as Record<ApiAlgoVersionId, AlgoVersion>),
        };
      });
  },
});

export default algosReducer.reducer;
