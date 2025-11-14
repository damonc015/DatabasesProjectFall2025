import { useQuery } from '@tanstack/react-query';

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
