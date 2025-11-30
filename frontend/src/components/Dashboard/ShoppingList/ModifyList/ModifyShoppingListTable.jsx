import { useEffect, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TableFallback from '../TableFallback';
import { useShoppingListItems } from '../../../../hooks/useShoppingListItems';
import useShoppingListStore from '../../../../stores/useShoppingListStore';

export default function ModifyShoppingListTable() {
  const { activeListId } = useShoppingListStore();
  const { data, error, isLoading } = useShoppingListItems(activeListId);

  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    if (Array.isArray(data) && data.length > 0) {
      const total = data.reduce((acc, item) => acc + parseFloat(item.TotalPrice), 0) || 0;
      setTotalPrice(total);
    }
  }, [data]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No items found</div>;

  // console.log('data', data);

  const tableHeaders = [
    { label: 'Item', align: 'left' },
    { label: 'Price Per Unit', align: 'left' },
    { label: 'Purchased Quantity', align: 'left' },
    { label: 'Total Price', align: 'left' },
  ];
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label='simple table'>
        <TableHead>
          <TableRow>
            {tableHeaders.map((header) => (
              <TableCell key={header.label} align='center' sx={{ fontWeight: 'bold', fontFamily: 'Balsamiq Sans' }}>
                {header.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.FoodItemID} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              {/* item name */}
              <TableCell component='th' scope='row' align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                {row.FoodItemName}
              </TableCell>
              {/* price per unit */}
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                {row.PricePerUnit}
              </TableCell>
              {/* purchased quantity */}
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                  <span>{row.PurchasedQty}</span>
                </div>{' '}
              </TableCell>
              {/* total price */}
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                <span>${parseFloat(row.TotalPrice || 0).toFixed(2)}</span>
              </TableCell>
            </TableRow>
          ))}
          {/* Item total row, last row in table */}
          {data.length > 0 && (
            <TableRow
              sx={{
                position: 'sticky',
                bottom: 0,
                zIndex: 100,
                backgroundColor: '#F3EFEA',
              }}
            >
              <TableCell
                colSpan={3}
                component='th'
                scope='row'
                align='center'
                sx={{
                  fontFamily: 'Balsamiq Sans',
                }}
              ></TableCell>
              <TableCell
                colSpan={1}
                component='th'
                scope='row'
                align='center'
                sx={{
                  fontFamily: 'Balsamiq Sans',
                }}
              >
                Total Price: <span style={{ marginLeft: '1rem' }}>${totalPrice.toFixed(2)}</span>
              </TableCell>
            </TableRow>
          )}
          {data.length === 0 && <TableFallback message='You saved an empty list'/>}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
