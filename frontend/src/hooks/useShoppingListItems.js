import { useQuery, useMutation } from '@tanstack/react-query';

export const useShoppingListItems = (shoppingListId) => {
  return useQuery({
    queryKey: ['shoppingListItems', shoppingListId],
    queryFn: async () => {
      const res = await fetch(`/api/shopping-lists/${shoppingListId}/items`);
      if (!res.ok) {
        throw new Error('Failed to fetch shopping list items');
      }
      return res.json();
    },
    enabled: !!shoppingListId,
  });
};

export const useAddShoppingListItems = (shoppingListId, items) => {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/shopping-lists/${shoppingListId}/items`, {
        method: 'POST',
        body: JSON.stringify(items),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shoppingListItems', shoppingListId]);
    },
  });
};