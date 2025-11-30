import { useCallback, useEffect, useState } from 'react';

export const useLocations = (householdId) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLocations = useCallback(async () => {
    if (!householdId) {
      setLocations([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5001/api/households/${householdId}/locations`);
      if (!res.ok) {
        throw new Error('Failed to load locations');
      }
      const data = await res.json();
      setLocations(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleLocationCreated = () => {
      fetchLocations();
    };

    window.addEventListener('locationCreated', handleLocationCreated);
    return () => {
      window.removeEventListener('locationCreated', handleLocationCreated);
    };
  }, [fetchLocations]);

  return {
    locations,
    loading,
    error,
    refreshLocations: fetchLocations,
  };
};
