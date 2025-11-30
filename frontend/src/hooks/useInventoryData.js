import { useCallback, useEffect, useState } from 'react';

export const useInventoryData = (householdId, locationFilter, searchQuery) => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInventory = useCallback(async () => {
    if (!householdId) {
      setInventory([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    const baseUrl =
      locationFilter === null
        ? `/api/transactions/inventory/${householdId}`
        : `/api/transactions/inventory/${householdId}/location/${locationFilter}`;

    const url =
      searchQuery && searchQuery.trim() !== ''
        ? `${baseUrl}?search=${encodeURIComponent(searchQuery.trim())}`
        : baseUrl;

    try {
      const res = await fetch(url, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to load inventory');
      }
      const data = await res.json();
      setInventory(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [householdId, locationFilter, searchQuery]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleTransactionCompleted = () => {
      fetchInventory();
    };

    window.addEventListener('transactionCompleted', handleTransactionCompleted);
    return () => {
      window.removeEventListener('transactionCompleted', handleTransactionCompleted);
    };
  }, [fetchInventory]);

  return {
    inventory,
    loading,
    error,
    refreshInventory: fetchInventory,
  };
};


