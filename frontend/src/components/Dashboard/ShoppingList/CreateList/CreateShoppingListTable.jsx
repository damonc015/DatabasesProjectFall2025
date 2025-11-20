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
import Button from '@mui/material/Button';
import NumberController from '../NumberController/NumberController';
import { useCreateShoppingList } from '../../../../hooks/useShoppingListMutations';
import { useCurrentUser } from '../../../../hooks/useCurrentUser';
import { useShoppingListItems } from '../../../../hooks/useShoppingListItems';

export default function CreateShoppingListTable() {
  const { householdId } = useCurrentUser();
  const createShoppingListMutation = useCreateShoppingList();
  const { data, error, isLoading } = useShoppingListItems(1);
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No items found</div>;

  const tableHeaders = [
    { label: 'Item' },
    { label: 'Price Per Unit' },
    { label: 'Purchased Quantity' },
    { label: 'Total Price' },
    { label: 'Mark as Purchased' },
    { label: 'Remove from List' },
  ];
  const suggestedRows = data.map((item) => {
    return {
      ShoppingListItemID: item.ShoppingListItemID,
      FoodItemName: item.FoodItemName,
      PricePerUnit: item.PricePerUnit,
      PurchasedQty: item.PurchasedQty,
      NeededQty: item.NeededQty,
      // price of one package of that item
      TotalPrice: item.TotalPrice,
      Status: item.Status,
    };
  });
  const rows = [];
  console.log(data);
  console.log(suggestedRows);
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
          {/* Items below threshold */}
          {suggestedRows.map((row) => (
            <TableRow key={row.name} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
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
                <NumberController id={row.ShoppingListItemID} defaultValue={row.NeededQty} />
              </TableCell>
              {/* total price */}
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                <NumberController id={row.ShoppingListItemID} defaultValue={row.NeededQty} label={'totalprice'} />
              </TableCell>
              {/* mark as purchased */}
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                <Checkbox
                  checked={row.Status === 'inactive'}
                  onChange={(e) => handleCheckboxChange(row.ShoppingListItemID, e.target.checked)}
                />
              </TableCell>
              {/* remove from list */}
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                <HighlightOffIcon className='muiicon' />
              </TableCell>
            </TableRow>
          ))}
          {/* Items not below threshold */}
          {rows.map((row) => (
            <TableRow key={row.name} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell component='th' scope='row' align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                {row.name}
              </TableCell>
              <TableCell component='th' scope='row' align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                {row.name}
              </TableCell>
              <TableCell component='th' scope='row' align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                {row.name}
              </TableCell>
              <TableCell component='th' scope='row' align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                {row.name}
              </TableCell>
              <TableCell colSpan={2} component='th' scope='row' align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                <Button className='table-button' variant='contained' color='primary'>
                  Add to List
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {/* Item total row, last row in table */}
          {rows.length > 0 ||
            (suggestedRows.length > 0 && (
              <TableRow
                sx={{
                  position: 'sticky',
                  bottom: 0,
                  zIndex: 100,
                  backgroundColor: '#F3EFEA',
                }}
              >
                <TableCell
                  colSpan={4}
                  component='th'
                  scope='row'
                  align='center'
                  sx={{
                    fontFamily: 'Balsamiq Sans',
                  }}
                ></TableCell>
                <TableCell
                  colSpan={2}
                  component='th'
                  scope='row'
                  align='center'
                  sx={{
                    fontFamily: 'Balsamiq Sans',
                  }}
                >
                  Total Price: <span style={{ marginLeft: '1rem' }}>$0.00</span>
                </TableCell>
              </TableRow>
            ))}
          {/* Fallback if there are no items */}
          {rows.length === 0 && suggestedRows.length === 0 && <TableFallback />}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
