import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import SelectGamePage from './components/pages/SelectGamePage/SelectGamePage';
import GamePage from './components/pages/GamePage/GamePage';
import GameInfoPage from './components/pages/GameInfoPage/GameInfoPage';
import store from './store';
import AdminPage from './components/pages/AdminPage/AdminPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <SelectGamePage />,
  },
  {
    path: '/gameinfo/:categoryId',
    element: <GameInfoPage />,
  },
  {
    path: '/game/:gameId',
    element: <GamePage />,
  },
  {
    path: '/admin',
    element: <AdminPage />,
  },
]);

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <Provider store={store.store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>,
);
