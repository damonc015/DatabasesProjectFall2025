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
import { useActiveShoppingList } from '../../../../hooks/useShoppingLists';
import { useShoppingListItems } from '../../../../hooks/useShoppingListItems';
import { useItemsNotOnActiveList } from '../../../../hooks/useFoodItems';
import { TRANSACTION_COMPLETED_EVENT } from '../../../../utils/transactionEvents';
import { useQueryClient } from '@tanstack/react-query';

export default function CreateShoppingListTable() {
  const { householdId } = useCurrentUser();
  const {
    data: activeShoppingListData,
    error: activeShoppingListError,
    isLoading: activeShoppingListLoading,
  } = useActiveShoppingList(householdId);

  const {
    data: shoppingListItemsData,
    error: shoppingListItemsError,
    isLoading: shoppingListItemsLoading,
  } = useShoppingListItems(activeShoppingListData?.ShoppingListID);

  const {
    data: foodItemsData,
    error: foodItemsError,
    isLoading: foodItemsLoading,
    refetch: refetchFoodItems,
  } = useItemsNotOnActiveList(householdId);

  const {
    tempCreateListBelowThresholdItems,
    setTempCreateListBelowThresholdItems,
    tempCreateListAtThresholdItems,
    setTempCreateListAtThresholdItems,
  } = useShoppingListStore();

  const [totalPrice, setTotalPrice] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleTransactionCompleted = () => {
      // console.log('Transaction completed event received');
      // console.log('Invalidating queries for household:', householdId);
      // console.log('Invalidating shopping list items for list:', activeShoppingListData?.ShoppingListID);

      refetchFoodItems();
      queryClient.invalidateQueries(['itemsNotOnActiveList', householdId]);
      queryClient.invalidateQueries(['shoppingLists', 'active', householdId]);
      if (activeShoppingListData?.ShoppingListID) {
        queryClient.invalidateQueries(['shoppingListItems', activeShoppingListData.ShoppingListID]);
      }
    };

    window.addEventListener(TRANSACTION_COMPLETED_EVENT, handleTransactionCompleted);
    return () => {
      window.removeEventListener(TRANSACTION_COMPLETED_EVENT, handleTransactionCompleted);
    };
  }, [activeShoppingListData?.ShoppingListID, refetchFoodItems, queryClient]);

  useEffect(() => {
    if (Array.isArray(shoppingListItemsData) && shoppingListItemsData.length > 0) {
      const processedData = shoppingListItemsData.map((item) => ({
        FoodItemID: item.FoodItemID,
        FoodItemName: item.FoodItemName,
        PricePerUnit: item.PricePerUnit,
        PurchasedQty: item.PurchasedQty,
        NeededQty: parseFloat(item.NeededQty),
        TotalPrice: parseFloat(item.TotalPrice) || 0,
        Status: item.Status,
        CurrentStock: item.CurrentStock,
        LocationID: item.LocationID,
        PackageID: item.PackageID,
        PackageBaseUnitAmt: item.PackageBaseUnitAmt ?? null,
        TargetLevel: item.TargetLevel,
      }));
      setTempCreateListBelowThresholdItems(processedData);
    }

    if (Array.isArray(foodItemsData) && foodItemsData.length > 0) {
      const processedData = foodItemsData.map((item) => ({
        FoodItemID: item.FoodItemID,
        FoodItemName: item.FoodItemName,
        PricePerUnit: item.PricePerUnit,
        PurchasedQty: item.PurchasedQty,
        NeededQty: parseFloat(item.NeededQty),
        TotalPrice: parseFloat(item.TotalPrice) || 0,
        Status: item.Status,
        CurrentStock: item.CurrentStock,
        LocationID: item.LocationID,
        PackageID: item.PackageID,
        PackageBaseUnitAmt: item.PackageBaseUnitAmt ?? null,
        TargetLevel: item.TargetLevel,
      }));
      setTempCreateListAtThresholdItems(processedData);
    }
  }, [shoppingListItemsData, foodItemsData]);

  useEffect(() => {
    const total = tempCreateListBelowThresholdItems.reduce((acc, item) => acc + parseFloat(item.TotalPrice), 0) || 0;
    setTotalPrice(total);
  }, [shoppingListItemsData, foodItemsData, tempCreateListBelowThresholdItems, tempCreateListAtThresholdItems]);

  if (!householdId) {
    return <div>No household id found</div>;
  }
  if (activeShoppingListLoading) return <div>Loading...</div>;
  if (activeShoppingListError) return <div>Error: {activeShoppingListError.message}</div>;
  if (!activeShoppingListData) return <div>No items found</div>;
  if (shoppingListItemsLoading) return <div>Loading...</div>;
  if (shoppingListItemsError) return <div>Error: {shoppingListItemsError.message}</div>;
  if (!shoppingListItemsData) return <div>No items found</div>;
  if (foodItemsLoading) return <div>Loading...</div>;
  if (foodItemsError) return <div>Error: {foodItemsError.message}</div>;
  if (!foodItemsData) return <div>No items found</div>;

  const handlePurchaseQtyChange = (itemId, newValue) => {
    const updatedItems = tempCreateListBelowThresholdItems.map((item) => {
      if (item.FoodItemID === itemId) {
        let newQty = parseFloat(newValue) || 0;
        newQty = Math.floor(newQty); // Ensure whole number

        const newTotalPrice = newQty * (parseFloat(item.PricePerUnit) || 0);
        return {
          ...item,
          PurchasedQty: newQty,
          TotalPrice: newTotalPrice.toFixed(2),
        };
      }
      return item;
    });

    setTempCreateListBelowThresholdItems(updatedItems);
  };

  // mark as purchased
  const handleMarkAsPurchased = (itemId) => {
    const item = tempCreateListBelowThresholdItems.find((item) => item.FoodItemID === itemId);
    if (!item) return;
    if (item && item.Status == 'active') {
      item.Status = 'inactive';
      setTempCreateListBelowThresholdItems(
        tempCreateListBelowThresholdItems.map((item) =>
          item.FoodItemID === itemId ? { ...item, Status: 'inactive' } : item
        )
      );
    } else {
      item.Status = 'active';
      setTempCreateListBelowThresholdItems(
        tempCreateListBelowThresholdItems.map((item) =>
          item.FoodItemID === itemId ? { ...item, Status: 'active' } : item
        )
      );
    }
  };

  // remove from list / add to list
  const handleRemoveFromList = (itemId) => {
    const itemToMove = tempCreateListBelowThresholdItems.find((item) => item.FoodItemID === itemId);

    if (itemToMove) {
      const updatedBelowList = tempCreateListBelowThresholdItems.filter((item) => item.FoodItemID !== itemId);
      const itemForAtList = {
        ...itemToMove,
      };
      const updatedAtList = [...tempCreateListAtThresholdItems, itemForAtList];
      setTempCreateListBelowThresholdItems(updatedBelowList);
      setTempCreateListAtThresholdItems(updatedAtList);
    }
  };

  const handleAddToList = (itemId) => {
    const itemToMove = tempCreateListAtThresholdItems.find((item) => item.FoodItemID === itemId);
    if (itemToMove) {
      const updatedAtList = tempCreateListAtThresholdItems.filter((item) => item.FoodItemID !== itemId);
      const originalItem = tempCreateListAtThresholdItems?.find((item) => item.FoodItemID === itemId);
      const itemForBelowList = {
        ...itemToMove,
        NeededQty: originalItem?.NeededQty,
        TotalPrice: originalItem?.TotalPrice || 0,
        Status: 'active',
      };
      const updatedBelowList = [...tempCreateListBelowThresholdItems, itemForBelowList];

      setTempCreateListBelowThresholdItems(updatedBelowList);
      setTempCreateListAtThresholdItems(updatedAtList);
    }
  };

  const tableHeaders = [
    { label: 'Item' },
    { label: 'Price Per Package' },
    { label: '# Packages to Restock' },
    { label: 'Total Price' },
    { label: 'Mark as Purchased' },
    { label: 'Remove from List' },
  ];

  // console.log('initial activeShoppingListData', activeShoppingListData);
  // console.log('initial shoppingListItemsData', shoppingListItemsData);
  // console.log('initial foodItemsData', foodItemsData);
  // console.log('tempCreateListBelowThresholdItems', tempCreateListBelowThresholdItems);
  // console.log('tempCreateListAtThresholdItems', tempCreateListAtThresholdItems);
  // console.log('totalPrice', totalPrice);
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
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans', margin: 'auto', padding: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                  <NumberController
                    id={row.FoodItemID}
                    value={row.PurchasedQty}
                    defaultValue={row.CurrentStock}
                    onBlur={(value) => handlePurchaseQtyChange(row.FoodItemID, value)}
                  />
                  <span style={{ marginLeft: '0.2rem' }}>{'/' + row.NeededQty}</span>
                </div>
              </TableCell>
              {/* total price */}
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                <span>{`$${parseFloat(row.TotalPrice || 0).toFixed(2)}`}</span>
              </TableCell>
              {/* mark as purchased */}
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                <Checkbox checked={row.Status === 'inactive'} onChange={() => handleMarkAsPurchased(row.FoodItemID)} />
              </TableCell>
              {/* remove from list */}
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                <HighlightOffIcon className='muiicon' onClick={() => handleRemoveFromList(row.FoodItemID)} />
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
                Add other items to list
              </TableCell>
            </TableRow>
          )}
          {tempCreateListAtThresholdItems.map((row) => (
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
                    value={row.PurchasedQty || 0}
                    defaultValue={row.PurchasedQty || 0}
                    disabled={true}
                  />{' '}
                  <span style={{ marginLeft: '0.2rem' }}>{'/' + row.NeededQty}</span>
                </div>
              </TableCell>
              {/* total price */}
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans', color: 'gray' }}>
                <span>{`$${parseFloat(row.TotalPrice || 0).toFixed(2)}`}</span>
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
                Total Price: <span style={{ marginLeft: '1rem' }}>${totalPrice.toFixed(2)}</span>
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
