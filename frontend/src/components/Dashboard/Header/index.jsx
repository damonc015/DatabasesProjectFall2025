import React from 'react'
import SettingsIcon from '@mui/icons-material/Settings';
import Button from '@mui/material/Button';
import { useNavigate } from '@tanstack/react-router';

const Header = () => {
  const navigate = useNavigate();
  const stored = JSON.parse(localStorage.getItem('user'));
  const user = stored?.user; 
  const username = user?.display_name || user?.username || 'Guest';

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate({ to: '/login' });
  }

  const householdName = user?.household || 'No Household';

  return (
    <div className='headerContainer'>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
        <h1>Stocker</h1>
        <span style={{ fontSize: '14px', color: '#666', fontWeight: 'normal' }}>
          {householdName}
        </span>
      </div>
      <div>
        <span>Welcome back, {username}</span>
        <SettingsIcon
         style={{ cursor: 'pointer', marginLeft: '10px', marginRight: '10px' }}
       onClick={() => navigate({ to: '/settings' })}/>
        <Button className='button' variant='contained' color='primary' onClick={handleLogout}>Logout</Button>
      </div>
    </div>
  )
}

export default Header