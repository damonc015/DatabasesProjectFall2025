import { useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useLocations } from '../../../hooks/useLocations';
import { useInventoryData } from '../../../hooks/useInventoryData';
import FoodCard from './FoodCard';
import AddItemCard from './AddItemCard';
import AddFoodItemModal from './AddFoodItemModal/index.jsx';
import EditFoodItemModal from './EditFoodItemModal/index.jsx';
import RestockModal from './RestockModal/index.jsx';

const Inventory = ({ showPackage, setShowPackage, searchQuery, selectedCategory }) => {
  const [locationFilter, setLocationFilter] = useState(null);
  const [modals, setModals] = useState({
    addItemOpen: false,
    edit: { open: false, item: null },
    restock: { open: false, item: null },
    addLocation: { open: false, name: '', loading: false, error: '' },
    renameLocation: { open: false, target: null, name: '', loading: false, error: '' }
  });
  const { addItemOpen, edit, restock, addLocation, renameLocation } = modals;
  
  const { householdId, user } = useCurrentUser();
  const userId = user?.id;
  const { locations, refreshLocations } = useLocations(householdId);
  const { inventory, refreshInventory } = useInventoryData(householdId, locationFilter, searchQuery);

  const filteredInventory = inventory.filter(item => {
    if (selectedCategory.length === 0) return true;
    const itemCategory = item.Category ? item.Category.trim() : '';
    return selectedCategory.some(cat => 
      cat.toLowerCase() === itemCategory.toLowerCase()
    );
  });
  const sortedInventory = [...filteredInventory].sort((a, b) => {
    const aZero =
      a.TotalQtyInBaseUnits !== undefined &&
      a.TotalQtyInBaseUnits !== null &&
      Number(a.TotalQtyInBaseUnits) === 0;
    const bZero =
      b.TotalQtyInBaseUnits !== undefined &&
      b.TotalQtyInBaseUnits !== null &&
      Number(b.TotalQtyInBaseUnits) === 0;

    if (aZero === bZero) return 0;
    if (aZero) return 1;
    if (bZero) return -1;
    return 0;
  });

  const handleAddLocationClick = () => {
    setModals((prev) => ({
      ...prev,
      addLocation: { ...prev.addLocation, open: true, name: '', error: '' }
    }));
  };

  const handleAddLocationClose = () => {
    if (addLocation.loading) return;
    setModals((prev) => ({
      ...prev,
      addLocation: { ...prev.addLocation, open: false, name: '', error: '' }
    }));
  };

  const handleSaveLocation = async () => {
    if (!householdId) {
      setModals((prev) => ({
        ...prev,
        addLocation: { ...prev.addLocation, error: 'Missing household information.' }
      }));
      return;
    }
    const trimmed = addLocation.name.trim();
    if (!trimmed) {
      setModals((prev) => ({
        ...prev,
        addLocation: { ...prev.addLocation, error: 'Please enter a location name.' }
      }));
      return;
    }

    setModals((prev) => ({
      ...prev,
      addLocation: { ...prev.addLocation, loading: true, error: '' }
    }));
    try {
      const response = await fetch(`http://localhost:5001/api/households/${householdId}/locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location_name: trimmed }),
      });

      if (!response.ok) {
        let message = 'Could not create location.';
        try {
          const errorPayload = await response.json();
          if (errorPayload?.error) {
            message = errorPayload.error;
          }
        } catch (err) {
          console.error('Error parsing location error response:', err);
        }
        throw new Error(message);
      }

      const newLocation = await response.json();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('locationCreated', { detail: newLocation }));
      }
      await refreshLocations();
      setModals((prev) => ({
        ...prev,
        addLocation: { ...prev.addLocation, open: false, name: '', error: '' }
      }));
      setLocationFilter(newLocation?.LocationID ?? null);
    } catch (err) {
      setModals((prev) => ({
        ...prev,
        addLocation: { ...prev.addLocation, error: err.message || 'Unable to create location.' }
      }));
    } finally {
      setModals((prev) => ({
        ...prev,
        addLocation: { ...prev.addLocation, loading: false }
      }));
    }
  };

  const selectedLocation = locations.find(
    (loc) => String(loc.LocationID) === String(locationFilter)
  );

  const handleRenameLocationClick = () => {
    if (!selectedLocation) return;
    setModals((prev) => ({
      ...prev,
      renameLocation: {
        ...prev.renameLocation,
        open: true,
        target: selectedLocation,
        name: selectedLocation.LocationName || '',
        error: ''
      }
    }));
  };

  const handleRenameLocationClose = () => {
    if (renameLocation.loading) return;
    setModals((prev) => ({
      ...prev,
      renameLocation: { ...prev.renameLocation, open: false, target: null, name: '', error: '' }
    }));
  };

  const handleSaveRenamedLocation = async () => {
    if (!householdId || !renameLocation.target) {
      setModals((prev) => ({
        ...prev,
        renameLocation: { ...prev.renameLocation, error: 'Missing location information.' }
      }));
      return;
    }
    const trimmed = renameLocation.name.trim();
    if (!trimmed) {
      setModals((prev) => ({
        ...prev,
        renameLocation: { ...prev.renameLocation, error: 'Please enter a location name.' }
      }));
      return;
    }

    setModals((prev) => ({
      ...prev,
      renameLocation: { ...prev.renameLocation, loading: true, error: '' }
    }));
    try {
      const response = await fetch(`http://localhost:5001/api/households/${householdId}/locations/${renameLocation.target.LocationID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location_name: trimmed }),
      });

      if (!response.ok) {
        let message = 'Could not rename location.';
        try {
          const errorPayload = await response.json();
          if (errorPayload?.error) {
            message = errorPayload.error;
          }
        } catch (err) {
          console.error('Error parsing rename response:', err);
        }
        throw new Error(message);
      }

      const updatedLocation = await response.json();
      await refreshLocations();
      setLocationFilter(updatedLocation?.LocationID ?? locationFilter);
      setModals((prev) => ({
        ...prev,
        renameLocation: { ...prev.renameLocation, open: false, target: null, name: '', error: '' }
      }));
    } catch (err) {
      setModals((prev) => ({
        ...prev,
        renameLocation: { ...prev.renameLocation, error: err.message || 'Unable to rename location.' }
      }));
    } finally {
      setModals((prev) => ({
        ...prev,
        renameLocation: { ...prev.renameLocation, loading: false }
      }));
    }
  };

  const noItemsMessage = (() => {
    if (inventory.length === 0) {
      return searchQuery?.trim() ? 'No items match your search.' : 'No items in inventory.';
    }
    return 'No items match your category filter.';
  })();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
          mb: 2
        }}
      >
        <Box sx={{ flexGrow: 1, borderBottom: 1, borderColor: 'divider', minWidth: 0, display: 'flex', alignItems: 'center' }}>
          <Tabs
            value={locationFilter ?? 'All'}
            onChange={(e, newValue) => setLocationFilter(newValue === 'All' ? null : newValue)}
            sx={{ flexGrow: 1, minHeight: '48px' }}
          >
            <Tab label="All" value="All" />
            {locations.map((location) => (
              <Tab key={location.LocationID} label={location.LocationName} value={location.LocationID} />
            ))}
          </Tabs>
          <IconButton
            color="primary"
            size="small"
            onClick={handleAddLocationClick}
            sx={{ ml: 1, border: 1, borderColor: 'divider' }}
            aria-label="Add location"
          >
            <AddIcon fontSize="small" />
          </IconButton>
          {selectedLocation && (
            <IconButton
              color="primary"
              size="small"
              onClick={handleRenameLocationClick}
              sx={{ ml: 1, border: 1, borderColor: 'divider' }}
              aria-label="Rename location"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
        <FormControlLabel
          sx={{ ml: { xs: 0, sm: 'auto' }, mt: { xs: 1, sm: 0 } }}
          control={
            <Switch
              checked={showPackage}
              onChange={(e) => setShowPackage(e.target.checked)}
            />
          }
          label={<Typography variant="caption">Show in Package</Typography>}
        />
      </Box>

      <Box
        sx={{
          backgroundColor: 'background.paper',
          borderRadius: 2,
          p: 3,
          minHeight: '30rem',
          maxHeight: '70vh',
          overflowY: 'auto',
          border: 2,
          borderColor: 'divider'
        }}
      >
        <Grid container spacing={2}>
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            lg={2}
            xl={2}
            sx={{
              display: 'flex',
              '@media (min-width: 1200px)': {
                width: '20%',
                maxWidth: '20%',
                flexBasis: '20%'
              }
            }}
          >
            <AddItemCard onClick={() => setModals((prev) => ({ ...prev, addItemOpen: true }))} />
          </Grid>
          {sortedInventory.length === 0 ? (
            <Grid item xs={12}>
              <Typography variant='body2' color='text.secondary'>
                {noItemsMessage}
              </Typography>
            </Grid>
          ) : (
            sortedInventory.map((item) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                lg={2}
                xl={2}
                key={item.FoodItemID}
                sx={{
                  display: 'flex',
                  '@media (min-width: 1200px)': {
                    width: '20%',
                    maxWidth: '20%',
                    flexBasis: '20%'
                  }
                }}
              >
                <FoodCard
                  item={item}
                  showPackage={showPackage}
                  userId={userId}
                  locationId={item.LocationID}
                  onTransactionComplete={refreshInventory}
                  onEdit={(itm) => {
                    setModals((prev) => ({
                      ...prev,
                      edit: { open: true, item: itm }
                    }));
                  }}
                  onRestock={(itm) => {
                    setModals((prev) => ({
                      ...prev,
                      restock: { open: true, item: itm }
                    }));
                  }}
                />
              </Grid>
            ))
          )}
        </Grid>
      </Box>
      <AddFoodItemModal
        open={addItemOpen}
        onClose={() => setModals((prev) => ({ ...prev, addItemOpen: false }))}
        onItemAdded={refreshInventory}
      />
      <EditFoodItemModal
        open={edit.open}
        onClose={() => {
          setModals((prev) => ({
            ...prev,
            edit: { open: false, item: null }
          }));
        }}
        item={edit.item}
        onItemUpdated={refreshInventory}
      />
      <RestockModal
        open={restock.open}
        onClose={() => {
          setModals((prev) => ({
            ...prev,
            restock: { open: false, item: null }
          }));
        }}
        item={restock.item}
        locations={locations}
        onRestocked={refreshInventory}
      />
      <Dialog open={addLocation.open} onClose={handleAddLocationClose} fullWidth maxWidth="xs">
        <DialogTitle>Add Location</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            autoFocus
            label="Location name"
            value={addLocation.name}
            onChange={(e) => {
              const value = e.target.value;
              setModals((prev) => ({
                ...prev,
                addLocation: { ...prev.addLocation, name: value, error: '' }
              }));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveLocation();
              }
            }}
            placeholder="e.g., Pantry, Freezer"
          />
          {addLocation.error && (
            <Typography variant="body2" color="error">
              {addLocation.error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleAddLocationClose} disabled={addLocation.loading}>
            Cancel
          </Button>
          <Button onClick={handleSaveLocation} variant="contained" disabled={addLocation.loading}>
            {addLocation.loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={renameLocation.open} onClose={handleRenameLocationClose} fullWidth maxWidth="xs">
        <DialogTitle>Rename Location</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            autoFocus
            label="Location name"
            value={renameLocation.name}
            onChange={(e) => {
              const value = e.target.value;
              setModals((prev) => ({
                ...prev,
                renameLocation: { ...prev.renameLocation, name: value, error: '' }
              }));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveRenamedLocation();
              }
            }}
            placeholder="e.g., Pantry, Freezer"
          />
          {renameLocation.error && (
            <Typography variant="body2" color="error">
              {renameLocation.error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleRenameLocationClose} disabled={renameLocation.loading}>
            Cancel
          </Button>
          <Button onClick={handleSaveRenamedLocation} variant="contained" disabled={renameLocation.loading}>
            {renameLocation.loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Inventory;
