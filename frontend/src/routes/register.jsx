import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import Register from '../components/Register';
import { useCurrentUser } from '../hooks/useCurrentUser';

function RegisterWrapper() {
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

  return <Register />;
}

export const Route = createFileRoute('/register')({
  component: RegisterWrapper,
});

