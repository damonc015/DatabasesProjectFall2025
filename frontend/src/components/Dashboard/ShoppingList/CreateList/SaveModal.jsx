import React from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import useShoppingListStore from '../../../../stores/useShoppingListStore';
import { useCurrentUser } from '../../../../hooks/useCurrentUser';
import { useActiveShoppingList } from '../../../../hooks/useShoppingLists';
import { useUpdateShoppingListItems } from '../../../../hooks/useShoppingListMutations';

const SaveModal = () => {
  const { householdId } = useCurrentUser();
  const { closeModal, tempCreateListBelowThresholdItems, isMiniModalOpen, setIsMiniModalOpen } = useShoppingListStore();
  const updateItemsMutation = useUpdateShoppingListItems();

  const {
    data: activeShoppingListData,
    error: activeShoppingListError,
    isLoading: activeShoppingListLoading,
  } = useActiveShoppingList(householdId);

  if (activeShoppingListLoading) return <div>Loading...</div>;
  if (activeShoppingListError) return <div>Error: {activeShoppingListError.message}</div>;
  if (!activeShoppingListData) return <div>No items found</div>;

  const handleCreateOrUpdateShoppingList = async () => {
    try {
      let shoppingListId = activeShoppingListData?.ShoppingListID;

      // 1. Create list if it doesn't exist
      if (!shoppingListId) {
        const result = await createShoppingListMutation.mutateAsync({ household_id: householdId });
        shoppingListId = result.shopping_list_id;
      }

      // 2. Prepare items from both lists (below and at threshold)
      const allItems = [...tempCreateListBelowThresholdItems, ...tempCreateListAtThresholdItems];

      if (shoppingListId && allItems.length > 0) {
        // Clean and validate the items before sending
        const cleanedItems = allItems.map((item) => ({
          FoodItemID: item.FoodItemID,
          LocationID: item.LocationID || null,
          PackageID: item.PackageID || null,
          NeededQuantity: parseFloat(item.NeededQty) || 0,
          PurchasedQuantity: parseInt(item.PurchasedQty, 10) || 0,
          TotalPrice: parseFloat(item.TotalPrice) || 0,
        }));

        console.log('Sending items to update:', cleanedItems);

        // 3. Update the items (using the new PUT /items route)
        await updateItemsMutation.mutateAsync({
          shoppingListId: shoppingListId,
          items: cleanedItems,
        });
      }
      console.log('List updated successfully');
    } catch (error) {
      console.error('Error creating/updating shopping list:', error);
    } finally {
      closeModal();
    }
  };
  const handleSaveLeaveList = () => {
    // handleCreateOrUpdateShoppingList();
    // setIsMiniModalOpen(false);
    console.log('saved changes left list open');
  };
  const handleSaveCloseList = () => {
    // setIsMiniModalOpen(false);
    // closeModal();
    console.log('saved changes closed list');
  };

  return (
    <Modal className='mini-modal-container' open={isMiniModalOpen} onClose={() => setIsMiniModalOpen(false)}>
      <Box className='box'>
        <h2>Save Updates?</h2>
        <div className='button-container'>
          <Button className='button' variant='contained' color='primary' onClick={handleSaveLeaveList}>
            Save Updates and Leave List Open
          </Button>
          <Button className='button' variant='contained' color='primary' onClick={handleSaveCloseList}>
            Save Updates and Close Out List
          </Button>
          <Button className='button' variant='contained' color='primary' onClick={() => setIsMiniModalOpen(false)}>
            Cancel
          </Button>
        </div>
      </Box>
    </Modal>
  );
};

export default SaveModal;
