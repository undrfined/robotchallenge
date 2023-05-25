import { configureStore } from '@reduxjs/toolkit';
import users, { getUserById } from '../slices/usersSlice';
import type { ApiUser } from '../../api/types';
import type { AppStore } from '../index';

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
    expect(store.getState().users.currentUserId).toBeUndefined();
  });

  // Other test cases for logout, attachToUserGroup, and apiThunk actions go here
});
