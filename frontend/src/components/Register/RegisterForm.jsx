import { Link } from '@tanstack/react-router';
import React, { useState } from 'react';
import { Box, TextField, Button } from '@mui/material';
import { useNavigate } from '@tanstack/react-router';
import Logo from '../Logo';


const RegisterForm = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');


  async function handleRegister() {
    setError('');

    try {
      const res = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, join_code: joinCode || null, display_name: username})
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      localStorage.setItem('user', JSON.stringify(data));
      if (!data.user?.household_id) {
        localStorage.removeItem('hasSeenWelcome');
      }
      navigate({ to: '/dashboard' });

    } catch (err) {
      setError('Network error');
    }
  }


  return (
    <Box className='register-container' component='form' noValidate autoComplete='off'>
      <div className='title-container'>
        <Logo />
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div className='input-container'>
        <TextField className='input' label='Username' variant='outlined' value={username} onChange={(e) => setUsername(e.target.value)} />
        <TextField className='input' label='Password' variant='outlined' type='password' value={password} onChange={(e) => setPassword(e.target.value)} />
        <TextField className='input' label='Join Household Code' variant='outlined' value={joinCode} onChange={(e) => setJoinCode(e.target.value)} />
      </div>
      <div>
        <Button className='button' variant='contained' color='primary' onClick={handleRegister}>
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
