import * as React from 'react';
import { Outlet, createRootRoute } from '@tanstack/react-router';
import TemporaryNavigation from '../components/Navigation';
import Error from '../components/Error';

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: () => <Error msg='error' />,
  notFoundComponent: () => <Error msg='not found' />,
});

function RootComponent() {
  return (
    <React.Fragment>
      {/* <TemporaryNavigation /> */}
      <Outlet />
    </React.Fragment>
  );
}
