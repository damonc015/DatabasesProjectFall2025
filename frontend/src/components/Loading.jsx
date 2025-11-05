import React from 'react'
import { CircularProgress } from '@mui/material';
import Logo from './Logo';

const Loading = () => {
  return (
    <div className='loading'>
        <div>
          <Logo />
        </div>
    </div>
  )
}

export default Loading