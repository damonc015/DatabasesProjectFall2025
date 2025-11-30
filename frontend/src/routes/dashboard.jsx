import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import Dashboard from '../components/Dashboard';
import { useCurrentUser } from '../hooks/useCurrentUser';

function DashboardWrapper() {
  const navigate = useNavigate();
  const { user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: '/login' });
    }
  }, [isLoading, navigate, user]);

  if (isLoading || !user) {
    return null;
  }

  return <Dashboard />;
}

export const Route = createFileRoute('/dashboard')({
  component: DashboardWrapper,
});
