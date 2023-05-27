import { configureStore } from '@reduxjs/toolkit';
import auth, { login } from '../slices/authSlice';
import type { AppStore } from '../index';
import type { AuthRequest } from '../../api/methods/auth';
import type { ResultType } from '../../api/makeRequest';
import { getUserById } from '../slices/usersSlice';

jest.mock('../../api/makeRequest', () => {
  return {
    __esModule: true,
    default: jest.fn(),
  };
});

describe('auth slice', () => {
  let store: AppStore;
  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth,
      },
    }) as unknown as AppStore;
  });

  it('login should redirect', async () => {
    const mockResponse: ResultType<AuthRequest> = {
      redirectUrl: 'http://example.com/',
    };
    jest.requireMock('../../api/makeRequest').default.mockResolvedValue(mockResponse);

    await store.dispatch(login());
    expect(window.location.href).toEqual(mockResponse.redirectUrl);
  });

  it('login should set isLoggingIn to true', async () => {
    const mockResponse: ResultType<AuthRequest> = {
      redirectUrl: 'http://example.com',
    };
    jest.requireMock('../../api/makeRequest').default.mockResolvedValue(mockResponse);

    await store.dispatch(login());
    expect(store.getState().auth.isLoggingIn).toEqual(true);
  });

  it('login should set isLoggingIn to false on error', async () => {
    jest.requireMock('../../api/makeRequest').default.mockRejectedValue(new Error('AsyncThunk failed'));

    await store.dispatch(login());
    expect(store.getState().auth.isLoggingIn).toEqual(false);
  });

  it('should set isLoggingIn to false when got user info', async () => {
    const mockResponse: ResultType<AuthRequest> = {
      redirectUrl: 'http://example.com',
    };
    jest.requireMock('../../api/makeRequest').default.mockResolvedValue(mockResponse);

    await store.dispatch(login());
    expect(store.getState().auth.isLoggingIn).toEqual(true);

    jest.requireMock('../../api/makeRequest').default.mockResolvedValue({
      id: '1',
      name: 'John Doe',
      avatarUrl: '',
      role: 'user',
    });
    await store.dispatch(getUserById());
    expect(store.getState().auth.isLoggingIn).toEqual(false);
  });

  it('should set isLoggingIn to false on unathorized error', async () => {
    const mockResponse: ResultType<AuthRequest> = {
      redirectUrl: 'http://example.com',
    };
    jest.requireMock('../../api/makeRequest').default.mockResolvedValue(mockResponse);

    await store.dispatch(login());
    expect(store.getState().auth.isLoggingIn).toEqual(true);

    jest.requireMock('../../api/makeRequest').default.mockRejectedValue(new Error('Unauthorized'));
    await store.dispatch(getUserById());
    expect(store.getState().auth.isLoggingIn).toEqual(false);
  });
});
