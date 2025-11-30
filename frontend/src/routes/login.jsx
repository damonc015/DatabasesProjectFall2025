import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import Login from '../components/Login';
import { useCurrentUser } from '../hooks/useCurrentUser';

function LoginWrapper() {
  const navigate = useNavigate();
  const { user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && user) {
      navigate({ to: '/dashboard' });
    }
  }, [isLoading, navigate, user]);

  if (user) {
    return null;
  }

  return <Login />;
}

export const Route = createFileRoute('/login')({
  component: LoginWrapper,
});
