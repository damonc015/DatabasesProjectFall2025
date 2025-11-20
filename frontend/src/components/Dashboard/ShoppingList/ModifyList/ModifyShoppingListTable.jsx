import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Checkbox from '@mui/material/Checkbox';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import TableFallback from '../TableFallback';
import NumberController from '../NumberController/NumberController';

export default function ModifyShoppingListTable({ shoppingListId }) {
  const { data, error, isLoading } = useShoppingListItems(shoppingListId);
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No items found</div>;
  const markItemMutation = useMarkShoppingListItem();

  const handleCheckboxChange = (itemId, isChecked) => {
    markItemMutation.mutate({
      listId: shoppingListId,
      itemId: itemId,
      status: isChecked ? 'inactive' : 'active',
    });
  };
  const tableHeaders = [
    { label: 'Item', align: 'left' },
    { label: 'Price Per Unit', align: 'left' },
    { label: 'Purchased Quantity', align: 'left' },
    { label: 'Total Price', align: 'left' },
    { label: 'Mark as Purchased', align: 'left' },
    { label: 'Remove from List', align: 'left' },
  ];
  const suggestedRows = [
    { name: 'Frozen yoghurt', calories: 159, fat: 6.0, carbs: 24, protein: 4.0 },
    { name: 'Ice cream sandwich', calories: 237, fat: 9.0, carbs: 37, protein: 4.3 },
    { name: 'Eclair', calories: 262, fat: 16.0, carbs: 24, protein: 6.0 },
    { name: 'Cupcake', calories: 305, fat: 3.7, carbs: 67, protein: 4.3 },
    { name: 'Gingerbread', calories: 356, fat: 16.0, carbs: 49, protein: 3.9 },
  ];
  const rows = [];

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
          {suggestedRows.map((row) => (
            <TableRow key={row.name} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell component='th' scope='row' align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                {row.name}
              </TableCell>
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                {row.calories}
              </TableCell>
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                <NumberController id='1' defaultValue={100} />
              </TableCell>
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                {row.carbs}
              </TableCell>
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                <Checkbox
                  checked={row.Status === 'inactive'}
                  onChange={(e) => handleCheckboxChange(row.ShoppingListItemID, e.target.checked)}
                />
              </TableCell>
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                <HighlightOffIcon className='muiicon' />
              </TableCell>
            </TableRow>
          ))}
          {rows.map((row) => (
            <TableRow key={row.name} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell component='th' scope='row' align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                {row.name}
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && <TableFallback />}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
