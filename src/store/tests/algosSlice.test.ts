import { configureStore } from '@reduxjs/toolkit';
import algos, {
  fetchAlgoFile, fetchAlgos, fetchAlgoVersions, uploadAlgo,
} from '../slices/algosSlice';
import users from '../slices/usersSlice';
import type { AppStore } from '../index';
import type { ResultType } from '../../api/makeRequest';
import type { GetAlgos, GetAlgoVersions } from '../../api/methods/algos';

window.MessageChannel = require('worker_threads').MessageChannel;

jest.mock('../../api/makeRequest', () => {
  return {
    __esModule: true,
    default: jest.fn(),
  };
});

describe('algos slice', () => {
  let store: AppStore;
  beforeEach(() => {
    store = configureStore({
      reducer: {
        algos,
        users,
      },
    }) as unknown as AppStore;
  });

  it('should fetch algos', async () => {
    const mockResponse: ResultType<GetAlgos> = [
      {
        id: 1,
        userId: '1',
        name: 'Test',
        language: 'rust',
      },
      {
        id: 2,
        userId: '1',
        name: 'Test2',
        language: 'rust',
      },
    ];
    jest.requireMock('../../api/makeRequest').default.mockResolvedValue(mockResponse);

    await store.dispatch(fetchAlgos());
    expect(store.getState().algos.algos).toEqual({
      1: { 1: mockResponse[0], 2: mockResponse[1] },
    });
  });

  it('should fetch different users\' algos', async () => {
    const mockResponse: ResultType<GetAlgos> = [
      {
        id: 1,
        userId: '1',
        name: 'Test',
        language: 'rust',
      },
      {
        id: 2,
        userId: '2',
        name: 'Test2',
        language: 'rust',
      },
    ];
    jest.requireMock('../../api/makeRequest').default.mockResolvedValue(mockResponse);

    await store.dispatch(fetchAlgos());
    expect(store.getState().algos.algos).toEqual({
      1: { 1: mockResponse[0] },
      2: { 2: mockResponse[1] },
    });
  });

  it('should fetch algo versions', async () => {
    const mockResponse: ResultType<GetAlgoVersions> = [{
      id: 2,
      algoId: 1,
      version: '1.0.0',
    }];

    jest.requireMock('../../api/makeRequest').default.mockResolvedValue(mockResponse);
    await store.dispatch(fetchAlgoVersions(1));
    expect(store.getState().algos.algoVersions).toEqual({
      1: { 2: mockResponse[0] },
    });
  });

  it('should fetch algo version file', async () => {
    const mockResponse: ResultType<GetAlgoVersions> = [{
      id: 2,
      algoId: 1,
      version: '1.0.0',
    }];

    jest.requireMock('../../api/makeRequest').default.mockResolvedValue(mockResponse);
    await store.dispatch(fetchAlgoVersions(1));
    expect(store.getState().algos.algoVersions).toEqual({
      1: { 2: mockResponse[0] },
    });

    const mockBlob = new Blob(['test'], { type: 'application/wasm' });
    jest.requireMock('../../api/makeRequest').default.mockResolvedValue(mockBlob);
    await store.dispatch(fetchAlgoFile({ algoId: 1, algoVersionId: 2 }));
    expect(store.getState().algos.algoVersions).toEqual({
      1: { 2: { ...mockResponse[0], file: mockBlob, isLoading: false } },
    });
  });

  it('should reset isLoading when algo version file loading failed', async () => {
    const mockResponse: ResultType<GetAlgoVersions> = [{
      id: 2,
      algoId: 1,
      version: '1.0.0',
    }];

    jest.requireMock('../../api/makeRequest').default.mockResolvedValue(mockResponse);
    await store.dispatch(fetchAlgoVersions(1));
    expect(store.getState().algos.algoVersions).toEqual({
      1: { 2: mockResponse[0] },
    });

    jest.requireMock('../../api/makeRequest').default.mockRejectedValue(new Error('test'));
    await store.dispatch(fetchAlgoFile({ algoId: 1, algoVersionId: 2 }));
    expect(store.getState().algos.algoVersions).toEqual({
      1: { 2: { ...mockResponse[0], isLoading: false } },
    });
  });

  it('should fail uploadAlgo when not authorized', async () => {
    const mockBlob = new Blob(['test'], { type: 'application/wasm' });
    jest.requireMock('../../api/makeRequest').default.mockResolvedValue(mockBlob);
    await expect(store.dispatch(uploadAlgo(mockBlob))).resolves.toHaveProperty('error');
  });
});
