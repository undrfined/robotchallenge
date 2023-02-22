import AuthRequests from './auth';
import UsersRequests from './users';
import AlgosRequests from './algos';
import CategoriesRequests from './categories';

type ApiRequests = AuthRequests | UsersRequests | AlgosRequests | CategoriesRequests;
export default ApiRequests;
