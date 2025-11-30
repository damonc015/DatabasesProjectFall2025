import { useState, useEffect } from 'react';

export const useFormData = (open, householdId) => {
  const [locations, setLocations] = useState([]);
  const [baseUnits, setBaseUnits] = useState([]);
  const [packageLabels, setPackageLabels] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !householdId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [locationsRes, baseUnitsRes, packageLabelsRes] = await Promise.all([
          fetch(`/api/households/${householdId}/locations`, { credentials: 'include' }),
          fetch('/api/food-items/base-units', { credentials: 'include' }),
          fetch(`/api/food-items/package-labels?household_id=${householdId}`, { credentials: 'include' })
        ]);

        const [locationsData, baseUnitsData, packageLabelsData] = await Promise.all([
          locationsRes.json(),
          baseUnitsRes.json(),
          packageLabelsRes.json()
        ]);

        setLocations(locationsData);
        setBaseUnits(baseUnitsData);
        setPackageLabels(packageLabelsData);
      } catch (err) {
        console.error('Error fetching form data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open, householdId]);

  return { locations, baseUnits, packageLabels, loading };
};

