import { Link } from '@tanstack/react-router';
import React, { useState } from 'react';
import { Box, TextField, Button } from '@mui/material';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import Logo from '../Logo';
import { CURRENT_USER_QUERY_KEY } from '../../hooks/useCurrentUser';


const RegisterForm = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');


  async function handleRegister() {
    setError('');

    if (!username || !password) {
      setError('Username and password are required');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          username, 
          password, 
          join_code: joinCode.trim() || null, 
          display_name: username
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, data?.user ?? null);
      navigate({ to: '/dashboard' });

    } catch (err) {
      setError('Network error');
    }
  }


  return (
    <Box className='register-container' component='form' noValidate autoComplete='off'>
      <div className='title-container'>
        <span className='left-logo'>Sto</span>
        <span className='right-logo'>ker</span>
        <Logo />
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div className='input-container'>
        <TextField 
          className='input' 
          label='Username' 
          variant='outlined' 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          required
        />
        <TextField 
          className='input' 
          label='Password' 
          variant='outlined' 
          type='password' 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required
        />
        <TextField 
          className='input' 
          label='Join Household Code (Optional)' 
          variant='outlined' 
          value={joinCode} 
          onChange={(e) => setJoinCode(e.target.value)}
          helperText="Leave empty to create your own household"
        />
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
