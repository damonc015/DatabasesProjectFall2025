import { useEffect, useMemo, useState } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import TextField from '@mui/material/TextField';
import { useCurrentUser } from '../../../../hooks/useCurrentUser';
import { CATEGORY_EMOJI } from '../../../../utils/foodEmojis';
import { useFormData } from '../AddFoodItemModal/useFormData';
import { LeftColumnFields, RightColumnFields } from '../AddFoodItemModal/FormFields';
import { validateForm } from '../AddFoodItemModal/validation';
import { updateFoodItem, createInventoryTransaction } from '../api';
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

const parseNumberOr = (value, fallback = null) => {
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const hasMeaningfulDelta = (value, epsilon = 0.0001) => Math.abs(value) >= epsilon;

const EditFoodItemModal = ({ open, onClose, item, onItemUpdated }) => {
  const { householdId, user } = useCurrentUser();
  const userId = user?.id;

  const [formData, setFormData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [stockSnapshot, setStockSnapshot] = useState({
    baseUnits: 0,
    packages: 0,
    packageSize: 0,
  });

  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);

  const { locations, baseUnits, packageLabels } = useFormData(open, householdId);

  const categories = Object.keys(CATEGORY_EMOJI);

  useEffect(() => {
    if (!open || !item) return;

    const currentBaseUnits = parseNumberOr(item.TotalQtyInBaseUnits, 0);
    const fallbackPackageSize = parseNumberOr(item.QtyPerPackage, 0);

    const loadDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/food-items/${item.FoodItemID}`);
        if (!response.ok) {
          throw new Error('Failed to load item details');
        }
        const data = await response.json();

        const packageBaseAmt = parseNumberOr(data.PackageBaseUnitAmt, fallbackPackageSize);
        let targetLevelPackages = '';
        if (data.TargetLevel != null && packageBaseAmt && packageBaseAmt !== 0) {
          const baseUnits = parseFloat(data.TargetLevel);
          if (!isNaN(baseUnits)) {
            targetLevelPackages = (baseUnits / packageBaseAmt).toFixed(2);
          }
        }

        const currentPackages =
          packageBaseAmt && packageBaseAmt > 0
            ? currentBaseUnits / packageBaseAmt
            : currentBaseUnits;

        setStockSnapshot({
          baseUnits: currentBaseUnits,
          packages: currentPackages,
          packageSize: packageBaseAmt || 0,
        });

        setFormData({
          food_name: data.Name || item.FoodName || '',
          type: data.Type || item.Type || '',
          category: normalizeCategoryKey(data.Category || item.Category || '', categories),
          location_id: item.LocationID || '',
          package_label: data.PackageLabel || item.PackageLabel || '',
          package_base_unit_amt: packageBaseAmt ? String(packageBaseAmt) : '',
          target_level: targetLevelPackages || '',
          quantity: formatQuantityValue(currentPackages),
          price_per_item: data.LatestPrice != null ? String(data.LatestPrice) : '',
          store: data.LatestStore || ''
        });
      } catch (err) {
        console.error('Error loading item details:', err);

        const packageBaseAmt = fallbackPackageSize || 0;
        const currentPackages =
          packageBaseAmt > 0 ? currentBaseUnits / packageBaseAmt : currentBaseUnits;

        setStockSnapshot({
          baseUnits: currentBaseUnits,
          packages: currentPackages,
          packageSize: packageBaseAmt,
        });

        setFormData({
          food_name: item.FoodName || '',
          type: item.Type || '',
          category: normalizeCategoryKey(item.Category || '', categories),
          location_id: item.LocationID || '',
          package_label: item.PackageLabel || '',
          package_base_unit_amt: packageBaseAmt ? String(packageBaseAmt) : '',
          target_level: '',
          quantity: formatQuantityValue(currentPackages),
          price_per_item: '',
          store: ''
        });
      } finally {
        setError('');
      }
    };

    loadDetails();
  }, [open, item]);

  const handleChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    setError('');
  };

  const handleClose = () => {
    setFormData(null);
    setError('');
    setStockSnapshot({
      baseUnits: 0,
      packages: 0,
      packageSize: 0,
    });
    onClose();
  };

  const handleExpireNow = async () => {
    if (!formData || !item) return;

    if (!userId) {
      setError('Missing user information. Please log in again to expire items.');
      return;
    }

    const locationId = formData.location_id || item.LocationID;
    if (!locationId) {
      setError('Please select a location before expiring.');
      return;
    }

    const quantityToExpire = parseNumberOr(stockSnapshot.baseUnits, 0);
    if (!hasMeaningfulDelta(quantityToExpire)) {
      setError('No remaining stock to expire.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await createInventoryTransaction({
        food_item_id: item.FoodItemID,
        location_id: locationId,
        user_id: userId,
        transaction_type: 'expire',
        quantity: quantityToExpire,
        expiration_date: todayISO,
      });

      window.dispatchEvent(new CustomEvent('transactionCompleted'));

      if (onItemUpdated) {
        onItemUpdated();
      }

      handleClose();
    } catch (err) {
      console.error('Error expiring item:', err);
      setError(err.message || 'Could not expire item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData || !item) return;

    setError('');

    const validationError = validateForm(formData, { requireBaseUnitId: false });
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!userId) {
      setError('Missing user information. Please log in again to update quantities.');
      return;
    }

    const originalLocationId = item.LocationID;
    const targetLocationId = formData.location_id || originalLocationId;

    if (!targetLocationId) {
      setError('Please select a location before saving.');
      return;
    }

    const desiredPackages = parseNumberOr(formData.quantity, null);
    if (desiredPackages === null) {
      setError('Please enter a valid quantity.');
      return;
    }

    const effectivePackageSize =
      parseNumberOr(formData.package_base_unit_amt, stockSnapshot.packageSize) ||
      parseNumberOr(item.QtyPerPackage, 0) ||
      0;

    const desiredBaseUnits =
      effectivePackageSize > 0
        ? packagesToBaseUnits(desiredPackages, effectivePackageSize)
        : desiredPackages;

    const currentBaseUnits = parseNumberOr(stockSnapshot.baseUnits, 0) || 0;
    const deltaBaseUnits = desiredBaseUnits - currentBaseUnits;
    const locationChanged =
      targetLocationId &&
      (originalLocationId == null ||
        String(originalLocationId) !== String(targetLocationId));

    setLoading(true);
    let emittedTransactionEvent = false;
    try {
      const payload = {
        food_name: formData.food_name.toLowerCase().trim(),
        type: (formData.type || '').toLowerCase().trim(),
        category: formData.category.toLowerCase().trim(),
        package_label: formData.package_label.toLowerCase().trim(),
        package_base_unit_amt: parseFloat(formData.package_base_unit_amt),
      };

      if (formData.price_per_item) {
        payload.price_per_item = parseFloat(formData.price_per_item);
      }
      if (formData.target_level) {
        payload.target_level = parseFloat(formData.target_level);
      }
      if (formData.store) {
        payload.store = formData.store.toLowerCase().trim();
      }

      await updateFoodItem(item.FoodItemID, payload);

      if (locationChanged) {
        const qtyToMove = Math.max(currentBaseUnits, 0);

        if (qtyToMove > 0 && originalLocationId) {
          await createInventoryTransaction({
            food_item_id: item.FoodItemID,
            location_id: originalLocationId,
            user_id: userId,
            transaction_type: 'transfer_out',
            quantity: qtyToMove,
          });
          await createInventoryTransaction({
            food_item_id: item.FoodItemID,
            location_id: targetLocationId,
            user_id: userId,
            transaction_type: 'transfer_in',
            quantity: qtyToMove,
          });
        } else {
          await createInventoryTransaction({
            food_item_id: item.FoodItemID,
            location_id: targetLocationId,
            user_id: userId,
            transaction_type: 'transfer_in',
            quantity: 0,
          });
        }

        emittedTransactionEvent = true;
      }

      if (hasMeaningfulDelta(deltaBaseUnits)) {
        await createInventoryTransaction({
          food_item_id: item.FoodItemID,
          location_id: targetLocationId,
          user_id: userId,
          transaction_type: deltaBaseUnits > 0 ? 'add' : 'remove',
          quantity: Math.abs(deltaBaseUnits),
        });
        emittedTransactionEvent = true;
      }

      if (emittedTransactionEvent) {
        window.dispatchEvent(new CustomEvent('transactionCompleted'));
      }

      if (onItemUpdated) {
        onItemUpdated();
      }

      handleClose();
    } catch (err) {
      console.error('Error updating food item:', err);
      setError(err.message || 'Could not update item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!formData) return null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="edit-food-item-modal"
      aria-describedby="edit-food-item-form"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: '80%', md: '800px' },
          maxHeight: '90vh',
          overflowY: 'auto',
          bgcolor: 'background.paper',
          border: '2px solid',
          borderColor: 'divider',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography id="edit-food-item-modal" variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
            Edit Item
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {error && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
            <Typography color="error" variant="body2">{error}</Typography>
          </Box>
        )}

        <Box component="form" onSubmit={handleSubmit} id="edit-food-item-form">
          <Grid container spacing={3} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <LeftColumnFields
                  formData={formData}
                  handleChange={handleChange}
                  locations={locations}
                  categories={categories}
                  showExpiration={false}
                />
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    p: 2,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'primary.light',
                    backgroundColor: '#f8f1e5',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 1 }}>
                      Total Quantity (pkg)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Reconcile
                    </Typography>
                  </Box>
                  <TextField
                    type="number"
                    value={formData.quantity}
                    onChange={handleChange('quantity')}
                    fullWidth
                    inputProps={{ min: '0', step: '0.01' }}
                    sx={{
                      '& .MuiInputBase-root': { fontSize: '1.25rem', fontWeight: 'bold' },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Enter the current total. The system will reconcile the difference.
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <RightColumnFields
                  formData={formData}
                  handleChange={handleChange}
                  baseUnits={baseUnits}
                  packageLabels={packageLabels}
                  readOnlyBaseUnit
                  baseUnitLabel={item.BaseUnitAbbr}
                  quantityFieldOptions={{
                    hideField: true,
                  }}
                />
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    p: 2,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'primary.light',
                    backgroundColor: '#f8f1e5',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 1 }}>
                      Expire Item
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Expire remaining stock
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Marks all remaining stock as expired with date {todayISO}.
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleExpireNow}
                    disabled={loading}
                  >
                    Expire Remaining Stock
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
              fullWidth
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default EditFoodItemModal;


