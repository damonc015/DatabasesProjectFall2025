import React from 'react';
import db_logo from '../../../assets/db_logo.svg';

const StaticLogo = () => {
  return (
    <div className='static-logo-container'>
      <span className='left-logo'>Sto</span>
      <span className='right-logo'>ker</span>
      <img className='db-logo' src={db_logo} alt='db_logo' />
    </div>
  );
};

export default StaticLogo;
