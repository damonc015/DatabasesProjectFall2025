import React from 'react';
import db_logo from '../../../assets/db_logo.svg';

const StaticLogo = ({ householdName }) => {
  if (!householdName) {
    return (
      <div className='static-logo-container'>
        <span className='left-logo'>Sto</span>
        <span className='right-logo'>ker</span>
        <img className='db-logo' src={db_logo} alt='db_logo' />
      </div>
    );
  }
  return (
    <>
      <div className='static-logo-container'>
        <span className='left-logo'>Sto</span>
        <span className='right-logo'>ker</span>
        <img className='db-logo' src={db_logo} alt='db_logo' />
        <span style={{ position: 'absolute', right: '-9.5rem', top: '2.35rem' }}>{householdName}</span>
      </div>
    </>
  );
};

export default StaticLogo;
