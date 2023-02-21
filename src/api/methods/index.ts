import AuthRequests from './auth';
import UsersRequests from './users';
import AlgosRequests from './algos';

type ApiRequests = AuthRequests | UsersRequests | AlgosRequests;
export default ApiRequests;
