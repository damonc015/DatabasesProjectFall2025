import React from 'react';
import useShoppingListStore from '../../../../stores/useShoppingListStore';
import Button from '@mui/material/Button';
import { useCurrentUser } from '../../../../hooks/useCurrentUser';
import { useItemsBelowTarget, useItemsAtOrAboveTarget } from '../../../../hooks/useFoodItems';
import { useCreateShoppingList, useAddShoppingListItems } from '../../../../hooks/useShoppingListMutations';

const CreateShoppingListButton = () => {
  const { householdId } = useCurrentUser();
  const { closeModal, tempCreateListBelowThresholdItems } = useShoppingListStore();
  const createShoppingListMutation = useCreateShoppingList();
  const addItemsMutation = useAddShoppingListItems();
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
  
  if (belowThresholdLoading || atThresholdLoading) return <div>Loading...</div>;
  if (belowThresholdError || atThresholdError)
    return <div>Error: {belowThresholdError.message || atThresholdError.message}</div>;
  //  only display if no items found in either
  if (!belowThresholdData && !atThresholdData) return <div>Cannot create a shopping list. No items found</div>;

  const handleCreateShoppingList = async () => {
    try {
      const result = await createShoppingListMutation.mutateAsync({ household_id: householdId });
      // add items after creating list
      if (result && result.shopping_list_id && tempCreateListBelowThresholdItems.length > 0) {
        await addItemsMutation.mutateAsync({
          shoppingListId: result.shopping_list_id,
          items: tempCreateListBelowThresholdItems,
        });
      }
      console.log('list created successfully');
    } catch (error) {
      console.error('Error creating shopping list:', error);
    } finally {
      closeModal();
    }
  };
  return (
    <>
      <Button className='button' variant='contained' color='primary' onClick={handleCreateShoppingList}>
        Create New List
      </Button>
    </>
  );
};

export default CreateShoppingListButton;
