import React from 'react';
import { Box, TextField, Button } from '@mui/material';
import { Link } from '@tanstack/react-router';
import Logo from '../Logo';

const RegisterForm = () => {
  return (
    <Box className='register-container' component='form' noValidate autoComplete='off'>
      <div className='title-container'>
        <Logo />
      </div>
      <div className='input-container'>
        <TextField className='input' label='Username' variant='outlined' />
        <TextField className='input' label='Password' variant='outlined' />
        <TextField className='input' label='Join Household Code' variant='outlined' />
      </div>
      <div>
        <Button className='button' variant='contained' color='primary'>
          Register
        </Button>
        <p>
          Already have an account? <Link to='/login'>Login</Link>
        </p>
      </div>
    </Box>
  );
};

export default RegisterForm;
