import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { Typography } from '@mui/material';

const Transactions = () => {
  return (
    <div className='transactionsContainer'>
      <h1>Transactions</h1>
      <Card className='cardContainer' variant='outlined'>
        <CardContent>
          <Typography variant='h6'>Transactions</Typography>
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;
