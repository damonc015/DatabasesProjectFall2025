import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
// import './index.css';
import './styles/App.scss';
import '@fontsource/balsamiq-sans/400.css';
import '@fontsource/balsamiq-sans/700.css';
import { routeTree } from './routeTree.gen';
import theme from './theme';

const router = createRouter({ routeTree });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>
);
