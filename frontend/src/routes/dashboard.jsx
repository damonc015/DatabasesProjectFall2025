import { createFileRoute, useNavigate } from '@tanstack/react-router';
import Dashboard from '../components/Dashboard';
import { useEffect, useState } from 'react';
import { restoreSessionFromCookie } from '../utils/session';

function DashboardWrapper() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    let isMounted = true;

    async function ensureUser() {
      const stored = JSON.parse(localStorage.getItem("user"));
      const user = stored?.user;
      
      if (user?.id) {
        if (isMounted) setIsChecking(false);
        return;
      }

      const restored = await restoreSessionFromCookie();
      if (!isMounted) return;

      if (restored?.id) {
        setIsChecking(false);
        return;
      }

      navigate({ to: "/register" });
    }

    ensureUser();

    return () => {
      isMounted = false;
    };
  }, [navigate]);
  
  if (isChecking) return null;

  return <Dashboard />;
}

export const Route = createFileRoute('/dashboard')({
  component: DashboardWrapper,
});
