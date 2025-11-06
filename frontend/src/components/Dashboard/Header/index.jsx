import React from 'react'
import SettingsIcon from '@mui/icons-material/Settings';
import Button from '@mui/material/Button';

const Header = () => {
  const username = 'John Doe';
  return (
    <div className='headerContainer'>
      <h1>Stocker</h1>
      <div>
        <span>Welcome back, {username}</span>
        <SettingsIcon />
        <Button className='button' variant='contained' color='primary'>Logout</Button>
      </div>
    </div>
  )
}

export default Header