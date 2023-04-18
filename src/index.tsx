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
import type { CategoryId } from './store/slices/categoriesSlice';
import { fetchCategories } from './store/slices/categoriesSlice';
import { selectCategories, selectCategory } from './store/selectors/categoriesSelectors';

const router = createBrowserRouter([
  {
    path: '/',
    element: <SelectGamePage />,
    loader: () => {
      if (selectCategories(store.store.getState()).length) {
        return Promise.resolve(null);
      }
      return store.store.dispatch(fetchCategories());
    },
  },
  {
    path: '/gameinfo/:categoryId',
    element: <GameInfoPage />,
    loader: ({ params }) => {
      const { categoryId } = params;
      if (!categoryId) throw new Error('No category id');

      if (selectCategory(Number(categoryId) as CategoryId)(store.store.getState()) !== undefined) {
        return Promise.resolve(null);
      }

      return store.store.dispatch(fetchCategories());
    },
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
