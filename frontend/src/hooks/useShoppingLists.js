import { useQuery } from '@tanstack/react-query';

// get shopping lists
export const useShoppingLists = ({ param = 0, order = 'asc' } = {}) => {
  return useQuery({
    queryKey: ['shoppingLists', { param, order }],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        param: param.toString(),
        order
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
