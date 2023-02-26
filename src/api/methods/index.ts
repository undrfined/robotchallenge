import type AuthRequests from './auth';
import type UsersRequests from './users';
import type AlgosRequests from './algos';
import type CategoriesRequests from './categories';
import type UserGroupRequests from './userGroups';

type ApiRequests = AuthRequests | UsersRequests | AlgosRequests | CategoriesRequests | UserGroupRequests;
export default ApiRequests;
