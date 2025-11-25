import { useState, useEffect } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { useCurrentUser } from '../../../../hooks/useCurrentUser';
import { createInventoryTransaction, updateFoodItem } from '../api';
import { packagesToBaseUnits } from '../utils';

const RestockModal = ({ open, onClose, item, onRestocked, locations = [] }) => {
  const { user } = useCurrentUser();
  const userId = user?.id;

  const [form, setForm] = useState({
    transactionType: 'add',
    quantityPackages: 1,
    pricePerItem: '',
    store: '',
    expirationDate: '',
    locationId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !item) return;
    setForm({
      transactionType: 'add',
      quantityPackages: 1,
      pricePerItem: '',
      store: '',
      expirationDate: '',
      locationId: item?.LocationID || '',
    });
    setError('');
  }, [open, item]);

  if (!open || !item) return null;

  const handleChange = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
    setError('');
  };

  const isRemoving = form.transactionType === 'remove';
  const isTransfer = form.transactionType === 'transfer_in' || form.transactionType === 'transfer_out';
  const allowPriceFields = !isRemoving && !isTransfer;
  const allowExpiration = !isRemoving && !isTransfer;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!item || !userId) return;

    setLoading(true);
    setError('');

    try {
      const locationId = form.locationId || item.LocationID;
      if (!locationId) {
        setError('Please choose a location.');
        setLoading(false);
        return;
      }

      const baseMetadata = {
        food_name: (item.FoodName || '').toLowerCase().trim(),
        type: (item.Type || '').toLowerCase().trim(),
        category: (item.Category || '').toLowerCase().trim(),
        package_label: (item.PackageLabel || '').toLowerCase().trim(),
        package_base_unit_amt: item.QtyPerPackage,
      };

      const metadataExtras = {};

      if (allowPriceFields) {
        if (form.pricePerItem) {
          metadataExtras.price_per_item = parseFloat(form.pricePerItem);
        }
        if (form.store) {
          metadataExtras.store = form.store.toLowerCase().trim();
        }
      }

      if (Object.keys(metadataExtras).length > 0) {
        await updateFoodItem(item.FoodItemID, { ...baseMetadata, ...metadataExtras });
      }

      const quantityBaseUnits = packagesToBaseUnits(form.quantityPackages, item.QtyPerPackage);

      if (quantityBaseUnits > 0) {
        await createInventoryTransaction({
          food_item_id: item.FoodItemID,
          location_id: locationId,
          user_id: userId,
          transaction_type: form.transactionType,
          quantity: quantityBaseUnits,
          expiration_date: allowExpiration && form.expirationDate ? form.expirationDate : undefined,
        });

        window.dispatchEvent(new CustomEvent('transactionCompleted'));
      }

      if (onRestocked) {
        onRestocked();
      }

      onClose();
    } catch (err) {
      console.error('Error restocking item:', err);
      setError(err.message || 'Could not restock item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="restock-item-modal"
      aria-describedby="restock-item-form"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: '80%', md: '600px' },
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
          <Box>
            <Typography id="restock-item-modal" variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
              Stock Item
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {item.FoodName}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {error && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </Box>
        )}

        <Box component="form" id="restock-item-form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Action"
                value={form.transactionType}
                onChange={handleChange('transactionType')}
                fullWidth
              >
                <MenuItem value="add">Add</MenuItem>
                <MenuItem value="remove">Remove</MenuItem>
                <MenuItem value="transfer_in">Transfer In</MenuItem>
                <MenuItem value="transfer_out">Transfer Out</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Quantity (packages)"
                type="number"
                value={form.quantityPackages}
                onChange={handleChange('quantityPackages')}
                fullWidth
                inputProps={{ min: '0', step: '1' }}
                helperText={`Each package = ${item.QtyPerPackage}${item.BaseUnitAbbr || ''}`}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                select
                label="Location"
                value={form.locationId}
                onChange={handleChange('locationId')}
                fullWidth
                helperText="Choose the location this transaction applies to"
              >
                {locations.map((loc) => (
                  <MenuItem key={loc.LocationID} value={loc.LocationID}>
                    {loc.LocationName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {allowExpiration && (
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Expiration Date"
                  type="date"
                  value={form.expirationDate}
                  onChange={handleChange('expirationDate')}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <TextField
                label="Price Per Package"
                type="number"
                value={form.pricePerItem}
                onChange={handleChange('pricePerItem')}
                fullWidth
                inputProps={{ min: '0', step: '0.01' }}
                disabled={!allowPriceFields}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Store"
                value={form.store}
                onChange={handleChange('store')}
                fullWidth
                disabled={!allowPriceFields}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 3 }}>
            <Button type="submit" variant="contained" disabled={loading} fullWidth>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default RestockModal;


