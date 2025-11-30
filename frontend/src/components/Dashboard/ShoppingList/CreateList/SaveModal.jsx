import React from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import useShoppingListStore from '../../../../stores/useShoppingListStore';
import { useCurrentUser } from '../../../../hooks/useCurrentUser';
import { useActiveShoppingList } from '../../../../hooks/useShoppingLists';
import { useUpdateShoppingListItems, useCompleteActiveShoppingList } from '../../../../hooks/useShoppingListMutations';

const SaveModal = () => {
  const { householdId, user } = useCurrentUser();
  const { closeModal, tempCreateListBelowThresholdItems, isMiniModalOpen, setIsMiniModalOpen } = useShoppingListStore();
  const updateItemsMutation = useUpdateShoppingListItems();
  const completeActiveListMutation = useCompleteActiveShoppingList();

  const {
    data: activeShoppingListData,
    error: activeShoppingListError,
    isLoading: activeShoppingListLoading,
  } = useActiveShoppingList(householdId);

  if (activeShoppingListLoading) return <div>Loading...</div>;
  if (activeShoppingListError) return <div>Error: {activeShoppingListError.message}</div>;
  if (!activeShoppingListData) return <div>No items found</div>;

  const handleUpdateActiveShoppingList = async () => {
    try {
      const itemsToList = [...tempCreateListBelowThresholdItems];

      if (itemsToList.length > 0) {
        const cleanedItems = itemsToList.map((item) => ({
          FoodItemID: item.FoodItemID,
          LocationID: item.LocationID || null,
          PackageID: item.PackageID || null,
          NeededQuantity: parseFloat(item.NeededQty),
          PurchasedQuantity: parseInt(item.PurchasedQty, 10) || 0,
          TotalPrice: parseFloat(item.TotalPrice) || 0,
          Status: item.Status || 'active',
        }));

        console.log('Sending items to update:', cleanedItems);

        await updateItemsMutation.mutateAsync({
          household_id: householdId,
          items: cleanedItems,
        });
      }
      console.log('List updated successfully');
    } catch (error) {
      console.error('Error creating/updating shopping list:', error);
    }
  };
  const handleSaveLeaveList = async () => {
    await handleUpdateActiveShoppingList();
    setIsMiniModalOpen(false);
    console.log('saved changes left list open');
  };
  const handleSaveCloseList = async () => {
    await handleUpdateActiveShoppingList();
    try {
      await completeActiveListMutation.mutateAsync({ household_id: householdId, user_id: user?.id });
      console.log('saved changes closed list');
    } catch (error) {
      console.error('Failed to close list:', error);
    }
    setIsMiniModalOpen(false);
    closeModal();
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
