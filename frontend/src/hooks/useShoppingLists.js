import { useQuery } from '@tanstack/react-query';

// get active shopping list
export const useActiveShoppingList = (householdId) => {
  return useQuery({
    queryKey: ['shoppingLists', 'active', householdId],
    queryFn: async () => {
      if (!householdId) return null;
      const res = await fetch(`/api/shopping-lists/active?household_id=${householdId}`);

      if (!res.ok) {
        throw new Error('Failed to fetch active shopping list');
      }

      return res.json();
    },
    enabled: !!householdId,
  });
};

// get shopping lists
export const useShoppingLists = ({ param = 0, order = 'asc' } = {}) => {
  return useQuery({
    queryKey: ['shoppingLists', { param, order }],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        param: param.toString(),
        order,
      });

      const res = await fetch(`/api/shopping-lists?${queryParams}`);

      if (!res.ok) {
        throw new Error('Failed to fetch shopping lists');
      }

      return res.json();
    },
  });
};

// get completed shopping lists
export const useCompletedShoppingLists = () => {
  return useQuery({
    queryKey: ['shoppingLists', 'completed'],
    queryFn: async () => {
      const res = await fetch('/api/shopping-lists/completed');

      if (!res.ok) {
        throw new Error('Failed to fetch completed shopping lists');
      }

      return res.json();
    },
  });
};
