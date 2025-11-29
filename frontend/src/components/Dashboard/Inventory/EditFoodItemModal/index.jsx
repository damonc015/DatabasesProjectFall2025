import { useEffect, useMemo, useState } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import TextField from '@mui/material/TextField';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useCurrentUser } from '../../../../hooks/useCurrentUser';
import { CATEGORY_EMOJI } from '../../../../utils/foodEmojis';
import { dispatchTransactionCompleted } from '../../../../utils/transactionEvents';
import { useFormData } from '../AddFoodItemModal/useFormData';
import { LeftColumnFields, RightColumnFields } from '../AddFoodItemModal/FormFields';
import { validateForm } from '../AddFoodItemModal/validation';
import { updateFoodItem, createInventoryTransaction, archiveFoodItem } from '../api';
import { useFoodItemDetails, useInventoryAdjustment } from './hooks';

const EditFoodItemModal = ({ open, onClose, item, onItemUpdated }) => {
  const { householdId, user } = useCurrentUser();
  const userId = user?.id;

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);

  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);

  const { locations, baseUnits, packageLabels } = useFormData(open, householdId);
  const categories = useMemo(() => Object.keys(CATEGORY_EMOJI), []);
  const {
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
  } = useFoodItemDetails({ open, item, categories });
  const {
    desiredPackages,
    effectivePackageSize,
    desiredBaseUnits,
    deltaBaseUnits,
    currentBaseUnits,
    targetLocationId,
  } = useInventoryAdjustment({ formData, stockSnapshot, item });

  useEffect(() => {
    if (open) {
      setError('');
    }
  }, [open, item]);

  const handleChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    setError('');
  };

  const handleClose = () => {
    resetDetails();
    setError('');
    setArchiveLoading(false);
    onClose();
  };

  const isBusy = loading || archiveLoading;

  const handleExpireNow = async () => {
    if (!formData || !item) return;


    const quantityToExpire = currentBaseUnits;
    if (!quantityToExpire) {
      setError('No items to expire!');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await createInventoryTransaction({
        food_item_id: item.FoodItemID,
        location_id: targetLocationId,
        user_id: userId,
        transaction_type: 'expire',
        quantity: quantityToExpire,
      });

      if (onItemUpdated) {
        onItemUpdated();
      }

      handleClose();
    } catch (err) {
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

    if (!targetLocationId) {
      setError('Please select a location before saving.');
      return;
    }

    if (desiredPackages === null) {
      setError('Please enter a valid quantity.');
      return;
    }

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

      if (latestExpiration && latestExpiration !== originalLatestExpiration) {
        try {
          const expirationRes = await fetch(`http://localhost:5001/api/transactions/food-item/${item.FoodItemID}/latest-expiration`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ expiration_date: latestExpiration }),
          });
          if (!expirationRes.ok) {
            const payload = await expirationRes.json().catch(() => ({}));
            throw new Error(payload?.error || 'Could not update expiration date.');
          }
          setOriginalLatestExpiration(latestExpiration);
        } catch (expErr) {
          setExpirationError(expErr.message || 'Could not update expiration date.');
          setLoading(false);
          return;
        }
      }

      if (locationChanged) {
        const qtyToMove = Math.max(currentBaseUnits, 0);

        if (qtyToMove > 0 && originalLocationId) {
          await createInventoryTransaction({
            food_item_id: item.FoodItemID,
            location_id: originalLocationId,
            user_id: userId,
            transaction_type: 'transfer_out',
            quantity: qtyToMove,
          }, { notify: false });
          await createInventoryTransaction({
            food_item_id: item.FoodItemID,
            location_id: targetLocationId,
            user_id: userId,
            transaction_type: 'transfer_in',
            quantity: qtyToMove,
          }, { notify: false });
        } else {
          await createInventoryTransaction({
            food_item_id: item.FoodItemID,
            location_id: targetLocationId,
            user_id: userId,
            transaction_type: 'transfer_in',
            quantity: 0,
          }, { notify: false });
        }

        emittedTransactionEvent = true;
      }

      if (deltaBaseUnits !== 0) {
        await createInventoryTransaction({
          food_item_id: item.FoodItemID,
          location_id: targetLocationId,
          user_id: userId,
          transaction_type: deltaBaseUnits > 0 ? 'add' : 'remove',
          quantity: Math.abs(deltaBaseUnits),
        }, { notify: false });
        emittedTransactionEvent = true;
      }

      if (emittedTransactionEvent) {
        dispatchTransactionCompleted();
      }

      if (onItemUpdated) {
        onItemUpdated();
      }

      handleClose();
    } catch (err) {
      setError(err.message || 'Could not update item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveItem = async () => {
    if (!item) return;

    const confirmed = window.confirm(
      'Are you sure? It will disappear from your inventory but the history will remain.'
    );
    if (!confirmed) return;

    setError('');
    setArchiveLoading(true);
    try {
      await archiveFoodItem(item.FoodItemID);

      if (onItemUpdated) {
        onItemUpdated();
      }

      handleClose();
    } catch (err) {
      setError(err.message || 'Could not archive item. Please try again.');
    } finally {
      setArchiveLoading(false);
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
                
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Expiration Date"
                    value={latestExpiration ? dayjs(latestExpiration) : null}
                    onChange={(newValue) => {
                      if (!newValue || !newValue.isValid()) {
                        setLatestExpiration('');
                      } else {
                        setLatestExpiration(newValue.format('YYYY-MM-DD'));
                      }
                      setExpirationError('');
                    }}
                    minDate={dayjs(todayISO)}
                    disabled={expirationLoading}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        InputLabelProps: { shrink: true },
                      },
                    }}
                  />
                </LocalizationProvider>
                {expirationError && (
                  <Typography variant="caption" color="error">
                    {expirationError}
                  </Typography>
                )}
                <TextField
                  label="Reconile Total Quantity (pkg)"
                  type="number"
                  value={formData.quantity}
                  onChange={handleChange('quantity')}
                  fullWidth
                  inputProps={{ min: '0', step: '0.01' }}
                />
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
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleExpireNow}
                    disabled={isBusy}
                    sx={{ alignSelf: 'flex-start', mt: 1 }}
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
              disabled={isBusy}
              fullWidth
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleArchiveItem}
              disabled={isBusy}
              fullWidth
            >
              {archiveLoading ? 'Archiving...' : 'Archive Item'}
            </Button>
            <Typography variant="caption" color="text.secondary" textAlign="center">
              Archiving hides the item and all packages but keeps your history intact.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default EditFoodItemModal;


