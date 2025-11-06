import React from 'react';
import { Box, TextField, Button } from '@mui/material';
import { Link } from '@tanstack/react-router';
import Logo from '../Logo';

const LoginForm = () => {
  return (
    <Box className='login-container' component='form' noValidate autoComplete='off'>
      <div className='title-container'>
        <span className='left-logo'>Sto</span>
        <span className='right-logo'>ker</span>
        <Logo />
      </div>
      <div className='input-container'>
        <TextField className='input' label='Username' variant='outlined' />
        <TextField className='input' label='Password' variant='outlined' />
      </div>
      <div>
        <Button className='button' variant='contained' color='primary'>
          Login
        </Button>
        <p>
          Don't have an account? <Link to='/register'>Register</Link>
        </p>
      </div>
    </Box>
  );
};

export default LoginForm;
