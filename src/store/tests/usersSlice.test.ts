import { configureStore } from '@reduxjs/toolkit';
import users, { getUserById } from '../slices/usersSlice';
import type { ApiUser } from '../../api/types';
import type { AppStore } from '../index';
import { logout } from '../slices/authSlice';
import { attachToUserGroup } from '../slices/userGroupsSlice';

jest.mock('../../api/makeRequest', () => {
  return {
    __esModule: true,
    default: jest.fn(),
  };
});

describe('users slice', () => {
  let store: AppStore;
  beforeEach(() => {
    store = configureStore({
      reducer: {
        users,
      },
    }) as unknown as AppStore;
  });

  it('getUserById.fulfilled should correctly modify state', async () => {
    const mockResponse: ApiUser = {
      id: '1',
      name: 'John Doe',
      avatarUrl: '',
      role: 'user',
    };
    jest.requireMock('../../api/makeRequest').default.mockResolvedValue(mockResponse);

    await store.dispatch(getUserById('1'));
    expect(store.getState().users.users['1']).toEqual(mockResponse);
  });

  it('getUserById.rejected should not modify state', async () => {
    jest.requireMock('../../api/makeRequest').default.mockRejectedValue(new Error('AsyncThunk failed'));

    await store.dispatch(getUserById('1'));
    expect(store.getState().users.users).toEqual({});
  });

  it('should set currentUserId to the first user returned by getUserById', async () => {
    const mockResponse: ApiUser = {
      id: '1',
      name: 'John Doe',
      avatarUrl: '',
      role: 'user',
    };
    jest.requireMock('../../api/makeRequest').default.mockResolvedValue(mockResponse);

    await store.dispatch(getUserById());
    expect(store.getState().users.currentUserId).toEqual('1');
    expect(store.getState().users.users['1']).toEqual(mockResponse);
  });

  it('should clear currentUserId on logout', async () => {
    const mockResponse: ApiUser = {
      id: '1',
      name: 'John Doe',
      avatarUrl: '',
      role: 'user',
    };
    jest.requireMock('../../api/makeRequest').default.mockResolvedValue(mockResponse);

    await store.dispatch(getUserById());
    expect(store.getState().users.currentUserId).toEqual('1');

    jest.requireMock('../../api/makeRequest').default.mockResolvedValue(undefined);
    await store.dispatch(logout());
    expect(store.getState().users.currentUserId).toEqual(undefined);
  });

  it('should not clear currentUserId on logout if the request fails', async () => {
    const mockResponse: ApiUser = {
      id: '1',
      name: 'John Doe',
      avatarUrl: '',
      role: 'user',
    };
    jest.requireMock('../../api/makeRequest').default.mockResolvedValue(mockResponse);

    await store.dispatch(getUserById());
    expect(store.getState().users.currentUserId).toEqual('1');

    jest.requireMock('../../api/makeRequest').default.mockRejectedValue(new Error('AsyncThunk failed'));
    await store.dispatch(logout());
    expect(store.getState().users.currentUserId).toEqual('1');
  });

  it('should clear currentUserId when any request fails with unauthorized', async () => {
    const mockResponse: ApiUser = {
      id: '1',
      name: 'John Doe',
      avatarUrl: '',
      role: 'user',
    };
    jest.requireMock('../../api/makeRequest').default.mockResolvedValue(mockResponse);

    await store.dispatch(getUserById());
    expect(store.getState().users.currentUserId).toEqual('1');

    jest.requireMock('../../api/makeRequest').default.mockRejectedValue(new Error('Unauthorized'));
    await store.dispatch(getUserById());
    expect(store.getState().users.currentUserId).toEqual(undefined);
  });

  it('should update user when attached to a group', async () => {
    const mockResponse: ApiUser = {
      id: '1',
      name: 'John Doe',
      avatarUrl: '',
      role: 'user',
    };
    jest.requireMock('../../api/makeRequest').default.mockResolvedValue(mockResponse);

    await store.dispatch(getUserById());
    expect(store.getState().users.currentUserId).toEqual('1');

    const mockResponseWithGroup: ApiUser = {
      id: '1',
      name: 'John Doe',
      avatarUrl: '',
      role: 'user',
      userGroupId: 1,
    };

    jest.requireMock('../../api/makeRequest').default.mockResolvedValue(mockResponseWithGroup);
    await store.dispatch(attachToUserGroup(1));
    expect(store.getState().users.users['1']).toEqual(mockResponseWithGroup);
  });
});
