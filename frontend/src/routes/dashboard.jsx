import { createFileRoute, useNavigate } from '@tanstack/react-router';
import Dashboard from '../components/Dashboard';
import { useEffect } from 'react';

function DashboardWrapper() {
  const navigate = useNavigate();
  
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("user"));
    const user = stored?.user;
    
    // Redirect to register if user is not authenticated
    if (!user || !user.id) {
      navigate({ to: "/register" });
      return;
    }
    
    // Users must have a household_id after registration
  }, [navigate]);
  
  return <Dashboard />;
}

export const Route = createFileRoute('/dashboard')({
  component: DashboardWrapper,
});
