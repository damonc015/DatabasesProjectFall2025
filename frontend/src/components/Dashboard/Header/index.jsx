import React from 'react';
import SettingsIcon from '@mui/icons-material/Settings';
import Button from '@mui/material/Button';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import StaticLogo from './StaticLogo';
import { useCurrentUser, CURRENT_USER_QUERY_KEY } from '../../../hooks/useCurrentUser';

const Header = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const username = user?.display_name || user?.username || 'Guest';

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
      navigate({ to: '/login' });
    }
  };

  const householdName = user?.household || 'No Household';

  return (
    <div className='headerContainer' style={{ alignItems: 'baseline', maxHeight: '14vh' }}>
      {/* --- Left Area --- */}
      <div style={{ align: 'center', display: 'flex', alignItems: 'baseline'}}>
        <StaticLogo />
        {householdName && householdName !== 'No Household' && (
          <span style={{
            marginLeft: '80px',
            position: 'relative',
            top: '-2px'
          }}>
            {householdName}
          </span>
        )}
      </div>
      {/* --- Right Area --- */}
      <div style={{ align: 'center', display: 'flex', alignItems: 'center' }}>
        <span>Welcome back, {username}</span>
        <SettingsIcon
          style={{
            cursor: 'pointer',
            marginLeft: '10px',
            marginRight: '10px',
          }}
          onClick={() => navigate({ to: '/settings' })}
        />
        <Button className='button' variant='contained' color='primary' onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Header;
