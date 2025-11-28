import React, { useState } from 'react';
import { Box, TextField, Button, FormControlLabel, Checkbox } from '@mui/material';
import { Link, useNavigate } from '@tanstack/react-router';
import Logo from '../Logo';

const LoginForm = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(true);

  async function handleLogin() {
    setError('');

    try {
      const res = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, remember })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      localStorage.setItem('user', JSON.stringify(data));
      navigate({ to: '/dashboard' });

    } catch (err) {
      setError('Network error');
    }
  }

  return (
    <Box className='login-container' component='form' noValidate autoComplete='off'>
      <div className='title-container'>
        <span className='left-logo'>Sto</span>
        <span className='right-logo'>ker</span>
        <Logo />
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div className='input-container'>
        <TextField className='input' label='Username' variant='outlined' value={username} onChange={(e) => setUsername(e.target.value)} />
        <TextField className='input' label='Password' variant='outlined' type='password' value={password} onChange={(e) => setPassword(e.target.value)} />
        <FormControlLabel
          control={
            <Checkbox
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              color='primary'
            />
          }
          label='Remember Me'
          sx={{ alignSelf: 'flex-start', mt: 1 }}
        />
      </div>
      <div>
        <Button className='button' variant='contained' color='primary' onClick={handleLogin}>
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
