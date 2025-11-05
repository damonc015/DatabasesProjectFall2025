import * as React from 'react';
import { Outlet, createRootRoute } from '@tanstack/react-router';
import TemporaryNavigation from '../components/Navigation';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <React.Fragment>
      <TemporaryNavigation />
      <Outlet />
    </React.Fragment>
  );
}
