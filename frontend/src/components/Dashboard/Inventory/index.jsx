import { useState, useEffect, useCallback } from 'react';
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
import FoodCard from './FoodCard';
import AddItemCard from './AddItemCard';
import AddFoodItemModal from './AddFoodItemModal/index.jsx';
import EditFoodItemModal from './EditFoodItemModal/index.jsx';
import RestockModal from './RestockModal/index.jsx';

const Inventory = ({ showPackage, setShowPackage, searchQuery, selectedCategory }) => {
  const [inventory, setInventory] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [restockItem, setRestockItem] = useState(null);
  const [addLocationOpen, setAddLocationOpen] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [addingLocation, setAddingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [renameLocationOpen, setRenameLocationOpen] = useState(false);
  const [locationToRename, setLocationToRename] = useState(null);
  const [renameLocationName, setRenameLocationName] = useState('');
  const [renamingLocation, setRenamingLocation] = useState(false);
  const [renameError, setRenameError] = useState('');
  
  const { householdId, user } = useCurrentUser();
  
  const userId = user?.id;

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

  const loadLocations = useCallback(async () => {
    if (!householdId) {
      setLocations([]);
      return;
    }

    try {
      const res = await fetch(`http://localhost:5001/api/households/${householdId}/locations`);
      if (!res.ok) {
        throw new Error('Failed to load locations');
      }
      const data = await res.json();
      setLocations(data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  }, [householdId]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  useEffect(() => {
    const handleLocationCreated = () => {
      loadLocations();
    };

    window.addEventListener('locationCreated', handleLocationCreated);
    return () => {
      window.removeEventListener('locationCreated', handleLocationCreated);
    };
  }, [loadLocations]);

  const handleAddLocationClick = () => {
    setNewLocationName('');
    setLocationError('');
    setAddLocationOpen(true);
  };

  const handleAddLocationClose = () => {
    if (addingLocation) return;
    setAddLocationOpen(false);
    setNewLocationName('');
    setLocationError('');
  };

  const handleSaveLocation = async () => {
    if (!householdId) {
      setLocationError('Missing household information.');
      return;
    }
    const trimmed = newLocationName.trim();
    if (!trimmed) {
      setLocationError('Please enter a location name.');
      return;
    }

    setAddingLocation(true);
    setLocationError('');
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
      setAddLocationOpen(false);
      setNewLocationName('');
      setLocationFilter(newLocation?.LocationID ?? null);
    } catch (err) {
      setLocationError(err.message || 'Unable to create location.');
    } finally {
      setAddingLocation(false);
    }
  };

  const selectedLocation = locations.find(
    (loc) => String(loc.LocationID) === String(locationFilter)
  );

  const handleRenameLocationClick = () => {
    if (!selectedLocation) return;
    setLocationToRename(selectedLocation);
    setRenameLocationName(selectedLocation.LocationName || '');
    setRenameError('');
    setRenameLocationOpen(true);
  };

  const handleRenameLocationClose = () => {
    if (renamingLocation) return;
    setRenameLocationOpen(false);
    setLocationToRename(null);
    setRenameLocationName('');
    setRenameError('');
  };

  const handleSaveRenamedLocation = async () => {
    if (!householdId || !locationToRename) {
      setRenameError('Missing location information.');
      return;
    }
    const trimmed = renameLocationName.trim();
    if (!trimmed) {
      setRenameError('Please enter a location name.');
      return;
    }

    setRenamingLocation(true);
    setRenameError('');
    try {
      const response = await fetch(`http://localhost:5001/api/households/${householdId}/locations/${locationToRename.LocationID}`, {
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
      await loadLocations();
      setLocationFilter(updatedLocation?.LocationID ?? locationFilter);
      handleRenameLocationClose();
    } catch (err) {
      setRenameError(err.message || 'Unable to rename location.');
    } finally {
      setRenamingLocation(false);
    }
  };

  const fetchInventory = useCallback(() => {
    if (!householdId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const baseUrl = locationFilter === null
      ? `http://localhost:5001/api/transactions/inventory/${householdId}`
      : `http://localhost:5001/api/transactions/inventory/${householdId}/location/${locationFilter}`;
    
    const url = searchQuery && searchQuery.trim() !== ''
      ? `${baseUrl}?search=${encodeURIComponent(searchQuery.trim())}`
      : baseUrl;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setInventory(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching inventory:', error);
        setLoading(false);
      });
  }, [householdId, locationFilter, searchQuery]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);
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
            <AddItemCard onClick={() => setModalOpen(true)} />
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
                  onTransactionComplete={fetchInventory}
                  onEdit={(itm) => {
                    setSelectedItem(itm);
                    setEditModalOpen(true);
                  }}
                  onRestock={(itm) => {
                    setRestockItem(itm);
                    setRestockModalOpen(true);
                  }}
                />
              </Grid>
            ))
          )}
        </Grid>
      </Box>
      <AddFoodItemModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onItemAdded={fetchInventory}
      />
      <EditFoodItemModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        onItemUpdated={fetchInventory}
      />
      <RestockModal
        open={restockModalOpen}
        onClose={() => {
          setRestockModalOpen(false);
          setRestockItem(null);
        }}
        item={restockItem}
        locations={locations}
        onRestocked={fetchInventory}
      />
      <Dialog open={addLocationOpen} onClose={handleAddLocationClose} fullWidth maxWidth="xs">
        <DialogTitle>Add Location</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            autoFocus
            label="Location name"
            value={newLocationName}
            onChange={(e) => {
              setNewLocationName(e.target.value);
              setLocationError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveLocation();
              }
            }}
            placeholder="e.g., Pantry, Freezer"
          />
          {locationError && (
            <Typography variant="body2" color="error">
              {locationError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleAddLocationClose} disabled={addingLocation}>
            Cancel
          </Button>
          <Button onClick={handleSaveLocation} variant="contained" disabled={addingLocation}>
            {addingLocation ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={renameLocationOpen} onClose={handleRenameLocationClose} fullWidth maxWidth="xs">
        <DialogTitle>Rename Location</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            autoFocus
            label="Location name"
            value={renameLocationName}
            onChange={(e) => {
              setRenameLocationName(e.target.value);
              setRenameError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveRenamedLocation();
              }
            }}
            placeholder="e.g., Pantry, Freezer"
          />
          {renameError && (
            <Typography variant="body2" color="error">
              {renameError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleRenameLocationClose} disabled={renamingLocation}>
            Cancel
          </Button>
          <Button onClick={handleSaveRenamedLocation} variant="contained" disabled={renamingLocation}>
            {renamingLocation ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Inventory;
