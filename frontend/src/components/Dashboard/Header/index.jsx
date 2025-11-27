import React from 'react';
import SettingsIcon from '@mui/icons-material/Settings';
import Button from '@mui/material/Button';
import { useNavigate } from '@tanstack/react-router';
import StaticLogo from './StaticLogo';

const Header = () => {
  const navigate = useNavigate();
  const stored = JSON.parse(localStorage.getItem('user'));
  const user = stored?.user;
  const username = user?.display_name || user?.username || 'Guest';

  const handleLogout = () => {
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).finally(() => {
      localStorage.removeItem('user');
      navigate({ to: '/login' });
    });
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
