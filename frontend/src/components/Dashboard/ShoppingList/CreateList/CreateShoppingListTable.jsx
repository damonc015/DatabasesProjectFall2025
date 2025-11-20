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
import useShoppingListStore from '../../../../stores/useShoppingListStore';
import { useCurrentUser } from '../../../../hooks/useCurrentUser';
import { useItemsBelowTarget, useItemsAtOrAboveTarget } from '../../../../hooks/useFoodItems';

export default function CreateShoppingListTable() {
  const { householdId } = useCurrentUser();
  const {
    data: belowThresholdData,
    error: belowThresholdError,
    isLoading: belowThresholdLoading,
  } = useItemsBelowTarget(householdId);
  const {
    data: atThresholdData,
    error: atThresholdError,
    isLoading: atThresholdLoading,
  } = useItemsAtOrAboveTarget(householdId);

  const {
    tempCreateListBelowThresholdItems,
    setTempCreateListBelowThresholdItems,
    tempCreateListAtThresholdItems,
    setTempCreateListAtThresholdItems,
  } = useShoppingListStore();

  useEffect(() => {
    if (belowThresholdData) {
      const processedData = belowThresholdData.map((item) => ({
        ShoppingListItemID: item.ShoppingListItemID,
        FoodItemName: item.FoodItemName,
        PricePerUnit: item.PricePerUnit,
        PurchasedQty: item.PurchasedQty,
        NeededQty: item.NeededQty,
        TotalPrice: item.TotalPrice,
        Status: item.Status,
        CurrentStock: item.CurrentStock,
      }));
      setTempCreateListBelowThresholdItems(processedData);
    }

    if (atThresholdData) {
      const processedData = atThresholdData.map((item) => ({
        ShoppingListItemID: item.ShoppingListItemID,
        FoodItemName: item.FoodItemName,
        PricePerUnit: item.PricePerUnit,
        PurchasedQty: item.PurchasedQty,
        NeededQty: item.NeededQty,
        TotalPrice: item.TotalPrice,
        Status: item.Status,
        CurrentStock: item.CurrentStock,
      }));
      setTempCreateListAtThresholdItems(processedData);
    }
  }, [belowThresholdData, atThresholdData, setTempCreateListBelowThresholdItems, setTempCreateListAtThresholdItems]);

  if (!householdId) {
    return <div>No household id found</div>;
  }
  if (belowThresholdLoading) return <div>Loading...</div>;
  if (belowThresholdError) return <div>Error: {belowThresholdError.message}</div>;
  if (!belowThresholdData) return <div>No items found</div>;
  if (atThresholdLoading) return <div>Loading...</div>;
  if (atThresholdError) return <div>Error: {atThresholdError.message}</div>;
  if (!atThresholdData) return <div>No items found</div>;

  const tableHeaders = [
    { label: 'Item' },
    { label: 'Price Per Unit' },
    { label: 'Purchased Quantity' },
    { label: 'Total Price' },
    { label: 'Mark as Purchased' },
    { label: 'Remove from List' },
  ];

  // mark as purchased
  const handleMarkAsPurchased = (itemId) => {
    const item = tempCreateListBelowThresholdItems.find((item) => item.ShoppingListItemID === itemId);
    if (item && item.Status == 'active') {
      item.Status = 'inactive';
      setTempCreateListBelowThresholdItems(
        tempCreateListBelowThresholdItems.map((item) =>
          item.ShoppingListItemID === itemId ? { ...item, Status: 'inactive' } : item
        )
      );
    } else {
      item.Status = 'active';
      setTempCreateListBelowThresholdItems(
        tempCreateListBelowThresholdItems.map((item) =>
          item.ShoppingListItemID === itemId ? { ...item, Status: 'active' } : item
        )
      );
    }
  };

  // remove from list / add to list
  const handleRemoveFromList = (itemId) => {
    const itemToMove = tempCreateListBelowThresholdItems.find((item) => item.ShoppingListItemID === itemId);

    if (itemToMove) {
      const updatedBelowList = tempCreateListBelowThresholdItems.filter((item) => item.ShoppingListItemID !== itemId);
      const itemForAtList = {
        ...itemToMove,
      };
      const updatedAtList = [...tempCreateListAtThresholdItems, itemForAtList];
      setTempCreateListBelowThresholdItems(updatedBelowList);
      setTempCreateListAtThresholdItems(updatedAtList);
    }
  };

  const handleAddToList = (itemId) => {
    const itemToMove = tempCreateListAtThresholdItems.find((item) => item.ShoppingListItemID === itemId);
    if (itemToMove) {
      const updatedAtList = tempCreateListAtThresholdItems.filter((item) => item.ShoppingListItemID !== itemId);
      const originalItem = belowThresholdData?.find((item) => item.ShoppingListItemID === itemId);
      const itemForBelowList = {
        ...itemToMove,
        NeededQty: originalItem?.NeededQty || 1,
        TotalPrice: originalItem?.TotalPrice || itemToMove.PricePerUnit,
        Status: 'active',
      };
      const updatedBelowList = [...tempCreateListBelowThresholdItems, itemForBelowList];

      setTempCreateListBelowThresholdItems(updatedBelowList);
      setTempCreateListAtThresholdItems(updatedAtList);
    }
  };

  console.log('tempCreateListBelowThresholdItems', tempCreateListBelowThresholdItems);
  console.log('tempCreateListAtThresholdItems', tempCreateListAtThresholdItems);
  console.log('belowThresholdData', belowThresholdData);
  console.log('atThresholdData', atThresholdData);
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
          {tempCreateListBelowThresholdItems.map((row) => (
            <TableRow key={row.ShoppingListItemID} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              {/* item name */}
              <TableCell component='th' scope='row' align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                {row.FoodItemName}
              </TableCell>
              {/* price per unit */}
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                {row.PricePerUnit}
              </TableCell>
              {/* purchased quantity */}
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans', margin: 'auto', padding: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <NumberController id={row.ShoppingListItemID} defaultValue={row.NeededQty} />{' '}
                  <span style={{ marginLeft: '0.2rem' }}>{'/' + row.NeededQty}</span>
                </div>
              </TableCell>
              {/* total price */}
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                <NumberController id={row.ShoppingListItemID} defaultValue={row.NeededQty} label={'totalprice'} />
              </TableCell>
              {/* mark as purchased */}
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                <Checkbox
                  checked={row.Status === 'inactive'}
                  onChange={() => handleMarkAsPurchased(row.ShoppingListItemID)}
                />
              </TableCell>
              {/* remove from list */}
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                <HighlightOffIcon className='muiicon' onClick={() => handleRemoveFromList(row.ShoppingListItemID)} />
              </TableCell>
            </TableRow>
          ))}
          {/* Items not below threshold */}
          {tempCreateListAtThresholdItems.length > 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                component='th'
                scope='row'
                align='center'
                sx={{ fontFamily: 'Balsamiq Sans', color: 'gray' }}
              >
                Add items that are at/above threshold
              </TableCell>
            </TableRow>
          )}
          {tempCreateListAtThresholdItems.map((row) => (
            <TableRow
              key={row.ShoppingListItemID}
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
                <NumberController id={row.ShoppingListItemID} defaultValue={row.NeededQty} />
              </TableCell>
              {/* total price */}
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans', color: 'gray' }}>
                <NumberController id={row.ShoppingListItemID} defaultValue={row.NeededQty} label={'totalprice'} />
              </TableCell>
              <TableCell colSpan={2} component='th' scope='row' align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                <Button
                  className='table-button'
                  variant='contained'
                  color='primary'
                  onClick={() => handleAddToList(row.ShoppingListItemID)}
                >
                  Add to List
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {/* Item total row, last row in table */}
          {(tempCreateListBelowThresholdItems.length > 0 || tempCreateListAtThresholdItems.length > 0) && (
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
          )}
          {/* Fallback if there are no items */}
          {tempCreateListBelowThresholdItems.length === 0 && tempCreateListAtThresholdItems.length === 0 && (
            <TableFallback />
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
