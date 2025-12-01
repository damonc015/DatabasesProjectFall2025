import { useQuery } from '@tanstack/react-query';

// Get all food items
export const useFoodItems = () => {
  return useQuery({
    queryKey: ['foodItems'],
    queryFn: async () => {
      const res = await fetch('/api/food-items');
      if (!res.ok) {
        throw new Error('Failed to fetch food items');
      }
      return res.json();
    },
  });
};

export const useItemsNotOnActiveList = (householdId) => {
  return useQuery({
    queryKey: ['itemsNotOnActiveList', householdId],
    queryFn: async () => {
      const res = await fetch(`/api/food-items/not-on-active-list?household_id=${householdId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch items not on active list');
      }
      return res.json();
    },
    enabled: !!householdId,
  });
};
