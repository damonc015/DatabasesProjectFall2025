import { createFileRoute, useNavigate } from '@tanstack/react-router';
import Dashboard from '../components/Dashboard';
import { useEffect } from 'react';

function DashboardWrapper() {
  const navigate = useNavigate();
  
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("user"));
    const user = stored?.user;
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome") === "true";
    
    // Only redirect to welcome if user has no household AND hasn't seen welcome page yet
    if (!user?.household_id && !hasSeenWelcome) {
      navigate({ to: "/welcome" });
    }
  }, [navigate]);
  
  return <Dashboard />;
}

export const Route = createFileRoute('/dashboard')({
  component: DashboardWrapper,
});
