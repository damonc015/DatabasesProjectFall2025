import { useMutation, useQueryClient } from '@tanstack/react-query';

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

// mark shopping list item
export const useMarkShoppingListItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ listId, itemId, status }) => {
      const res = await fetch(`/api/shopping-lists/${listId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: (_, { listId }) => {
      queryClient.invalidateQueries(['shoppingListItems', listId]);
    },
  });
};

// remove shopping list item
export const useRemoveShoppingListItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ listId, itemId }) => {
      const res = await fetch(`/api/shopping-lists/${listId}/items/${itemId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      return res.json();
    },
    onSuccess: (_, { listId }) => {
      queryClient.invalidateQueries(['shoppingListItems', listId]);
    },
  });
};
