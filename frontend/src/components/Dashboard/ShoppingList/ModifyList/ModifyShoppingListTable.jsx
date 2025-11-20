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
import { useShoppingListItems } from '../../../../hooks/useShoppingListItems';
import { useMarkShoppingListItem } from '../../../../hooks/useShoppingListMutations';
import useShoppingListStore from '../../../../stores/useShoppingListStore';

export default function ModifyShoppingListTable() {
  const { activeListId } = useShoppingListStore();
  const { data, error, isLoading } = useShoppingListItems(activeListId);
  const markItemMutation = useMarkShoppingListItem();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No items found</div>;

  const handleCheckboxChange = (itemId, isChecked) => {
    markItemMutation.mutate({
      listId: shoppingListId,
      itemId: itemId,
      status: isChecked ? 'inactive' : 'active',
    });
  };

  console.log(activeListId);

  const tableHeaders = [
    { label: 'Item', align: 'left' },
    { label: 'Price Per Unit', align: 'left' },
    { label: 'Purchased Quantity', align: 'left' },
    { label: 'Total Price', align: 'left' },
    { label: 'Mark as Purchased', align: 'left' },
    { label: 'Remove from List', align: 'left' },
  ];
  // const suggestedRows = data.map((item) => {
  //   return {
  //     ShoppingListItemID: item.ShoppingListItemID,
  //     FoodItemName: item.FoodItemName,
  //     PricePerUnit: item.PricePerUnit,
  //     PurchasedQty: item.PurchasedQty,
  //     NeededQty: item.NeededQty,
  //     // price of one package of that item
  //     TotalPrice: item.TotalPrice,
  //     Status: item.Status,
  //   };
  // });
  const suggestedRows = [
    {
      ShoppingListItemID: 1,
      FoodItemName: 'Frozen yoghurt',
      PricePerUnit: 10.0,
      PurchasedQty: 1,
      NeededQty: 1,
      TotalPrice: 10.0,
      Status: 'active',
    },
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
                {row.FoodItemName}
              </TableCell>
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                {row.PricePerUnit}
              </TableCell>
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                <NumberController id={row.ShoppingListItemID} defaultValue={row.NeededQty} />
              </TableCell>
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                <NumberController id={row.ShoppingListItemID} defaultValue={row.NeededQty} label={'totalprice'} />
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
