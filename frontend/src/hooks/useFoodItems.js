import { useState, useEffect } from 'react';

export const useFoodItems = () => {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/food-items')
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => {
        setItems(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { items, error, loading };
};

