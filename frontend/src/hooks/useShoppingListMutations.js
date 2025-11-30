import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dispatchTransactionCompleted } from '../utils/transactionEvents';

// update shopping list items without closing list 
export const useUpdateShoppingListItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ household_id, items }) => {
      const res = await fetch(`/api/shopping-lists/active/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ household_id, items }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update items');
      }

      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['shoppingListItems', data.shopping_list_id]);
      queryClient.invalidateQueries(['shoppingLists']);
    },
  });
};

// update, complete active list, and make new list with active status
export const useCompleteActiveShoppingList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ household_id, user_id }) => {
      const res = await fetch('/api/shopping-lists/complete-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ household_id, user_id }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to complete active list');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shoppingLists']);
      queryClient.invalidateQueries(['activeShoppingList']);
      dispatchTransactionCompleted();
    },
  });
};
