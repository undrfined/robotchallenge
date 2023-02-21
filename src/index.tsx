import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import SelectGamePage from './components/pages/SelectGamePage/SelectGamePage';
import GamePage from './components/pages/GamePage/GamePage';
import GameInfoPage from './components/pages/GameInfoPage/GameInfoPage';
import store from './store';

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
