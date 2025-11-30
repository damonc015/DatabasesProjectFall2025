import { useQuery } from '@tanstack/react-query';

// Get all food items
export const useFoodItems = () => {
  return useQuery({
    queryKey: ['foodItems'],
    queryFn: async () => {
      const res = await fetch('/api/food-items', {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to fetch food items');
      }
      return res.json();
    },
  });
};

export const useItemsBelowTarget = (householdId) => {
  return useQuery({
    queryKey: ['itemsBelowTarget', householdId],
    queryFn: async () => {
      const res = await fetch('/api/food-items/below-target', {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to fetch items below target');
      }
      return res.json();
    },
    enabled: !!householdId,
  });
};

export const useItemsAtOrAboveTarget = (householdId) => {
  return useQuery({
    queryKey: ['itemsAtOrAboveTarget', householdId],
    queryFn: async () => {
      const res = await fetch('/api/food-items/at-or-above-target', {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to fetch items at or above target');
      }
      return res.json();
    },
    enabled: !!householdId,
  });
};
