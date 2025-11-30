import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dispatchTransactionCompleted } from '../utils/transactionEvents';

// create shopping list
export const useCreateShoppingList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ household_id }) => {
      const res = await fetch('/api/shopping-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ household_id }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create shopping list');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shoppingLists']);
    },
  });
};

// add shopping list items
export const useAddShoppingListItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shoppingListId, items }) => {
      const res = await fetch(`/api/shopping-lists/${shoppingListId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add items');
      }

      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['shoppingListItems', variables.shoppingListId]);
      queryClient.invalidateQueries(['shoppingLists']);
    },
  });
};

// update shopping list items
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

// complete active list
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

// mark shopping list item
export const useMarkShoppingListItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shoppingListId, itemId, status }) => {
      const res = await fetch(`/api/shopping-lists/${shoppingListId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update item status');
      }

      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['shoppingListItems', variables.shoppingListId]);
    },
  });
};

// remove shopping list item
export const useRemoveShoppingListItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shoppingListId, itemId }) => {
      const res = await fetch(`/api/shopping-lists/${shoppingListId}/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to remove item');
      }

      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['shoppingListItems', variables.shoppingListId]);
      queryClient.invalidateQueries(['shoppingLists']);
    },
  });
};
