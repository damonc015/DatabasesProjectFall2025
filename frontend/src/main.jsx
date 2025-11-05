import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
// import './index.css';
import './styles/App.scss';
import '@fontsource/balsamiq-sans/400.css';
import '@fontsource/balsamiq-sans/700.css';
import { routeTree } from './routeTree.gen';

const router = createRouter({ routeTree });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
