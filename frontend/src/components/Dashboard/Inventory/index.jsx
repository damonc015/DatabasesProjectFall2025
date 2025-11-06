import React from 'react';
import Box from '@mui/material/Box';
import Grid2 from '@mui/material/Grid2';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

const Inventory = () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  return (
    <div className='inventoryContainer'>
      <Box sx={{ flexGrow: 1 }}>
        <Grid2 container spacing={2}>
          {items.map((item) => (
            <Grid2 size={3} key={item}>
              <Card variant='outlined'>
                <CardContent>
                  <Typography variant='h6'>{item}</Typography>
                </CardContent>
              </Card>
            </Grid2>
          ))}
        </Grid2>
      </Box>
    </div>
  );
};

export default Inventory;
