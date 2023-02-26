import AuthRequests from './auth';
import UsersRequests from './users';
import AlgosRequests from './algos';
import CategoriesRequests from './categories';
import UserGroupRequests from './userGroups';

type ApiRequests = AuthRequests | UsersRequests | AlgosRequests | CategoriesRequests | UserGroupRequests;
export default ApiRequests;
