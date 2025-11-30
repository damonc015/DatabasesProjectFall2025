import { useCallback, useEffect, useMemo, useState } from 'react';
import { normalizeCategoryKey, packagesToBaseUnits } from '../utils';

const formatQuantityValue = (value) => {
  const parsed = parseFloat(value);
  if (Number.isNaN(parsed)) {
    return '0';
  }
  const rounded = Math.round(parsed * 100) / 100;
  if (Number.isInteger(rounded)) {
    return String(rounded);
  }
  return rounded.toFixed(2).replace(/\.?0+$/, '');
};

export const parseNumberOr = (value, fallback = null) => {
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const initialSnapshot = { baseUnits: 0, packages: 0, packageSize: 0 };

export const useFoodItemDetails = ({ open, item, categories = [] }) => {
  const [formData, setFormData] = useState(null);
  const [stockSnapshot, setStockSnapshot] = useState(initialSnapshot);
  const [latestExpiration, setLatestExpiration] = useState('');
  const [originalLatestExpiration, setOriginalLatestExpiration] = useState('');
  const [expirationLoading, setExpirationLoading] = useState(false);
  const [expirationError, setExpirationError] = useState('');

  const resetDetails = useCallback(() => {
    setFormData(null);
    setStockSnapshot(initialSnapshot);
    setLatestExpiration('');
    setOriginalLatestExpiration('');
    setExpirationLoading(false);
    setExpirationError('');
  }, []);

  useEffect(() => {
    if (!open || !item) {
      return;
    }

    let isActive = true;
    const currentBaseUnits = parseNumberOr(item.TotalQtyInBaseUnits, 0);
    const fallbackPackageSize = parseNumberOr(item.QtyPerPackage, 0);

    const applyFormState = (payload, packageBaseAmt, currentPackages) => {
      if (!isActive) return;
      setStockSnapshot({
        baseUnits: currentBaseUnits,
        packages: currentPackages,
        packageSize: packageBaseAmt || 0,
      });
      setFormData(payload);
    };

    const loadDetails = async () => {
      try {
        const response = await fetch(`/api/food-items/${item.FoodItemID}`, {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Failed to load item details');
        }
        const data = await response.json();

        const packageBaseAmt = parseNumberOr(data.PackageBaseUnitAmt, fallbackPackageSize);
        let targetLevelPackages = '';
        if (data.TargetLevel != null && packageBaseAmt && packageBaseAmt !== 0) {
          const targetBaseUnits = parseFloat(data.TargetLevel);
          if (!Number.isNaN(targetBaseUnits)) {
            targetLevelPackages = (targetBaseUnits / packageBaseAmt).toFixed(2);
          }
        }

        const currentPackages =
          packageBaseAmt && packageBaseAmt > 0 ? currentBaseUnits / packageBaseAmt : currentBaseUnits;

        applyFormState(
          {
            food_name: data.Name || item.FoodName || '',
            type: data.Type || item.Type || '',
            category: normalizeCategoryKey(data.Category || item.Category || '', categories),
            location_id: item.LocationID || '',
            package_label: data.PackageLabel || item.PackageLabel || '',
            package_base_unit_amt: packageBaseAmt ? String(packageBaseAmt) : '',
            target_level: targetLevelPackages || '',
            quantity: formatQuantityValue(currentPackages),
            price_per_item: data.LatestPrice != null ? String(data.LatestPrice) : '',
            store: data.LatestStore || '',
          },
          packageBaseAmt,
          currentPackages
        );
      } catch (err) {
        const packageBaseAmt = fallbackPackageSize || 0;
        const currentPackages = packageBaseAmt > 0 ? currentBaseUnits / packageBaseAmt : currentBaseUnits;

        applyFormState(
          {
            food_name: item.FoodName || '',
            type: item.Type || '',
            category: normalizeCategoryKey(item.Category || '', categories),
            location_id: item.LocationID || '',
            package_label: item.PackageLabel || '',
            package_base_unit_amt: packageBaseAmt ? String(packageBaseAmt) : '',
            target_level: '',
            quantity: formatQuantityValue(currentPackages),
            price_per_item: '',
            store: '',
          },
          packageBaseAmt,
          currentPackages
        );
      }
    };

    const fetchLatestExpiration = async () => {
      setExpirationLoading(true);
      setExpirationError('');
      try {
        const res = await fetch(
          `/api/transactions/food-item/${item.FoodItemID}/latest-expiration`,
          { credentials: 'include' }
        );
        if (!res.ok) throw new Error('Could not fetch expiration date');
        const data = await res.json();
        if (!isActive) return;
        const expirationValue = data?.expiration_date || '';
        setLatestExpiration(expirationValue);
        setOriginalLatestExpiration(expirationValue);
      } catch (err) {
        if (!isActive) return;
        setLatestExpiration('');
        setOriginalLatestExpiration('');
      } finally {
        if (isActive) {
          setExpirationLoading(false);
        }
      }
    };

    loadDetails();
    fetchLatestExpiration();

    return () => {
      isActive = false;
    };
  }, [open, item, categories]);

  return {
    formData,
    setFormData,
    stockSnapshot,
    latestExpiration,
    setLatestExpiration,
    originalLatestExpiration,
    setOriginalLatestExpiration,
    expirationLoading,
    expirationError,
    setExpirationError,
    resetDetails,
  };
};

export const useInventoryAdjustment = ({ formData, stockSnapshot, item }) => {
  return useMemo(() => {
    const desiredPackages = parseNumberOr(formData?.quantity, null);
    const currentBaseUnits = parseNumberOr(stockSnapshot.baseUnits, 0) || 0;
    const packageFromForm = parseNumberOr(formData?.package_base_unit_amt, stockSnapshot.packageSize);
    const fallbackPackageSize = parseNumberOr(item?.QtyPerPackage, 0);
    const effectivePackageSize = packageFromForm || fallbackPackageSize || 0;

    const desiredBaseUnits =
      desiredPackages === null
        ? null
        : effectivePackageSize > 0
          ? packagesToBaseUnits(desiredPackages, effectivePackageSize)
          : desiredPackages;

    const deltaBaseUnits = desiredBaseUnits == null ? null : desiredBaseUnits - currentBaseUnits;
    const targetLocationId = formData?.location_id || item?.LocationID;

    return {
      desiredPackages,
      effectivePackageSize,
      desiredBaseUnits,
      deltaBaseUnits,
      currentBaseUnits,
      targetLocationId,
    };
  }, [formData, item?.LocationID, item?.QtyPerPackage, stockSnapshot.baseUnits, stockSnapshot.packageSize]);
};


