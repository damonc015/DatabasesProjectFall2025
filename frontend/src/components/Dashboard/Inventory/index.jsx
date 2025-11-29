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
import { useLocationModals } from '../../../hooks/useLocationModals';
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
    restock: { open: false, item: null }
  });
  const { addItemOpen, edit, restock } = modals;
  
  const { householdId, user } = useCurrentUser();
  const userId = user?.id;
  const { locations, refreshLocations } = useLocations(householdId);
  const { inventory, refreshInventory } = useInventoryData(householdId, locationFilter, searchQuery);
  const {
    addModal,
    renameModal,
    openAddModal,
    closeAddModal,
    updateAddName,
    saveAddLocation,
    openRenameModal,
    closeRenameModal,
    updateRenameName,
    saveRenamedLocation,
  } = useLocationModals({ householdId, refreshLocations });

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

  const selectedLocation = locations.find(
    (loc) => String(loc.LocationID) === String(locationFilter)
  );

  const handleRenameLocationClick = () => {
    if (!selectedLocation) return;
    openRenameModal(selectedLocation);
  };

  const handleAddLocationSubmit = async () => {
    const newLocation = await saveAddLocation();
    if (newLocation?.LocationID) {
      setLocationFilter(newLocation.LocationID);
    }
  };

  const handleRenameLocationSubmit = async () => {
    const updatedLocation = await saveRenamedLocation();
    if (updatedLocation?.LocationID) {
      setLocationFilter(updatedLocation.LocationID ?? locationFilter);
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
            onClick={openAddModal}
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
      <Dialog open={addModal.open} onClose={closeAddModal} fullWidth maxWidth="xs">
        <DialogTitle>Add Location</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            autoFocus
            label="Location name"
            value={addModal.name}
            onChange={(e) => {
              updateAddName(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddLocationSubmit();
              }
            }}
            placeholder="e.g., Pantry, Freezer"
          />
          {addModal.error && (
            <Typography variant="body2" color="error">
              {addModal.error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeAddModal} disabled={addModal.loading}>
            Cancel
          </Button>
          <Button onClick={handleAddLocationSubmit} variant="contained" disabled={addModal.loading}>
            {addModal.loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={renameModal.open} onClose={closeRenameModal} fullWidth maxWidth="xs">
        <DialogTitle>Rename Location</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            autoFocus
            label="Location name"
            value={renameModal.name}
            onChange={(e) => {
              updateRenameName(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleRenameLocationSubmit();
              }
            }}
            placeholder="e.g., Pantry, Freezer"
          />
          {renameModal.error && (
            <Typography variant="body2" color="error">
              {renameModal.error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeRenameModal} disabled={renameModal.loading}>
            Cancel
          </Button>
          <Button onClick={handleRenameLocationSubmit} variant="contained" disabled={renameModal.loading}>
            {renameModal.loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Inventory;
