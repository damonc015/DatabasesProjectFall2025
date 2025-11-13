import React from 'react'
import SettingsIcon from '@mui/icons-material/Settings';
import Button from '@mui/material/Button';
import StaticLogo from './StaticLogo';

const Header = () => {
  const username = 'John Doe';
  return (
    <div className='headerContainer'>
      <StaticLogo />
      <div>
        <span>Welcome back, {username}</span>
        <SettingsIcon />
        <Button className='button' variant='contained' color='primary'>Logout</Button>
      </div>
    </div>
  )
}

export default Header