import React from 'react';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

const TableFallback = ({ message = 'Register items to see them in a shopping list' }) => {
  return (
    <TableRow>
      <TableCell sx={{ fontFamily: 'Balsamiq Sans', height: '100%' }} colSpan={6} align='center'>
        <span>{message}</span>
      </TableCell>
    </TableRow>
  );
};

export default TableFallback;
