import { useEffect, useState } from 'react';
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
import { useShoppingListItems } from '../../../../hooks/useShoppingListItems';
import { useMarkShoppingListItem } from '../../../../hooks/useShoppingListMutations';
import useShoppingListStore from '../../../../stores/useShoppingListStore';

export default function ModifyShoppingListTable() {
  const { activeListId } = useShoppingListStore();
  const { data, error, isLoading } = useShoppingListItems(activeListId);
  const { tempActiveListItems, setTempActiveListItems } = useShoppingListStore();
  const markItemMutation = useMarkShoppingListItem();

  const [deletedItems, setDeletedItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    if (data) {
      const processedData = data.map((item) => ({
        FoodItemID: item.FoodItemID,
        FoodItemName: item.FoodItemName,
        PricePerUnit: item.PricePerUnit,
        PurchasedQty: item.PurchasedQty,
        NeededQty: parseFloat(item.NeededQty),
        TotalPrice: parseFloat(item.TotalPrice),
        Status: item.Status,
        CurrentStock: item.CurrentStock,
        LocationID: item.LocationID,
        PackageID: item.PackageID,
      }));
      setTempActiveListItems(processedData);
    }
  }, [data]);

  useEffect(() => {
    const total = tempActiveListItems.reduce((acc, item) => acc + parseFloat(item.TotalPrice), 0) || 0;
    setTotalPrice(total);
  }, [tempActiveListItems]);

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

  const handleRemoveFromList = (itemId) => {
    setDeletedItems([...deletedItems, tempActiveListItems.find((item) => item.FoodItemID === itemId)]);
    setTempActiveListItems(tempActiveListItems.filter((item) => item.FoodItemID !== itemId));
  };

  const handleAddToList = (itemId) => {
    const itemToMove = deletedItems.find((item) => item.FoodItemID === itemId);
    if (itemToMove) {
      setDeletedItems(deletedItems.filter((item) => item.FoodItemID !== itemId));
      setTempActiveListItems([...tempActiveListItems, itemToMove]);
    }
  };

  console.log('data', data);
  console.log('tempActiveListItems', tempActiveListItems);
  console.log('deletedItems', deletedItems);

  const tableHeaders = [
    { label: 'Item', align: 'left' },
    { label: 'Price Per Unit', align: 'left' },
    { label: 'Purchased Quantity', align: 'left' },
    { label: 'Total Price', align: 'left' },
    { label: 'Mark as Purchased', align: 'left' },
    { label: 'Remove from List', align: 'left' },
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
          {tempActiveListItems.map((row) => (
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
                  <NumberController
                    id={row.FoodItemID}
                    value={row.PurchasedQty}
                    defaultValue={row.CurrentStock}
                    // onBlur={(value) => handlePurchaseQtyChange(row.FoodItemID, value)}
                  />
                  <span style={{ marginLeft: '0.2rem' }}>{'/' + row.NeededQty}</span>
                </div>{' '}
              </TableCell>
              {/* total price */}
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                <NumberController
                  id={row.FoodItemID}
                  value={row.TotalPrice}
                  defaultValue={row.TotalPrice}
                  label={'totalprice'}
                  // onBlur={(value) => handleTotalPriceChange(row.FoodItemID, value)}
                />
              </TableCell>
              {/* mark as purchased */}
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                <Checkbox
                  checked={row.Status === 'inactive'}
                  onChange={(e) => handleCheckboxChange(row.FoodItemID, e.target.checked)}
                />
              </TableCell>
              {/* remove from list */}
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                <HighlightOffIcon className='muiicon' onClick={() => handleRemoveFromList(row.FoodItemID)} />
              </TableCell>
            </TableRow>
          ))}
          {deletedItems.length > 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                component='th'
                scope='row'
                align='center'
                sx={{ fontFamily: 'Balsamiq Sans', color: 'gray' }}
              >
                Deleted Items, click to readd
              </TableCell>
            </TableRow>
          )}
          {deletedItems.map((row) => (
            <TableRow
              key={row.FoodItemID}
              sx={{ '&:last-child td, &:last-child th': { border: 0 }, backgroundColor: '#F3EFEA' }}
            >
              {/* item name */}
              <TableCell component='th' scope='row' align='center' sx={{ fontFamily: 'Balsamiq Sans', color: 'gray' }}>
                {row.FoodItemName}
              </TableCell>
              {/* price per unit */}
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans', color: 'gray' }}>
                {row.PricePerUnit}
              </TableCell>
              {/* purchased quantity */}
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans', color: 'gray' }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                  <NumberController
                    id={row.FoodItemID}
                    value={row.CurrentStock}
                    defaultValue={row.CurrentStock}
                    disabled={true}
                  />{' '}
                  <span style={{ marginLeft: '0.2rem' }}>{'/' + row.NeededQty}</span>
                </div>
              </TableCell>
              {/* total price */}
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans', color: 'gray' }}>
                <NumberController
                  id={row.FoodItemID}
                  value={row.TotalPrice}
                  defaultValue={row.TotalPrice}
                  label={'totalprice'}
                  disabled={true}
                />
              </TableCell>
              <TableCell colSpan={2} component='th' scope='row' align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                <Button
                  className='table-button'
                  variant='contained'
                  color='primary'
                  onClick={() => handleAddToList(row.FoodItemID)}
                >
                  Add to List
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {/* Item total row, last row in table */}
          {(tempActiveListItems.length > 0 || deletedItems.length > 0) && (
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
                Total Price: <span style={{ marginLeft: '1rem' }}>${totalPrice.toFixed(2)}</span>
              </TableCell>
            </TableRow>
          )}
          {tempActiveListItems.length === 0 && deletedItems.length === 0 && <TableFallback />}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
