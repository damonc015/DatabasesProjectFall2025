import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import FoodCard from './FoodCard';

const Inventory = ({ showPackage, setShowPackage, searchQuery, selectedCategory }) => {
  const [inventory, setInventory] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState(null);
  
  const { householdId, user } = useCurrentUser();
  
  const userId = user?.id;

  const filteredInventory = inventory.filter(item => {
    const matchesCategory = selectedCategory.length > 0 ? selectedCategory.includes(item.Category) : true;
    return matchesCategory;
  });

  useEffect(() => {
    if (!householdId) return;

    fetch(`http://localhost:5001/api/households/${householdId}/locations`)
      .then(res => res.json())
      .then(data => {
        setLocations(data);
      })
      .catch(error => {
        console.error('Error fetching locations:', error);
      });
  }, [householdId]);

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
        <Typography variant='h6'>Inventory</Typography>
        <FormControlLabel
          control={
            <Switch
              checked={showPackage}
              onChange={(e) => setShowPackage(e.target.checked)}
            />
          }
          label={<Typography variant="caption">Show in Package</Typography>}
        />
      </Box>

      <Box sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={locationFilter ?? 'All'}
          onChange={(e, newValue) => setLocationFilter(newValue === 'All' ? null : newValue)}
        >
          <Tab label="All" value="All" />
          {locations.map((location) => (
            <Tab key={location.LocationID} label={location.LocationName} value={location.LocationID} />
          ))}
        </Tabs>
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
          {filteredInventory.length === 0 ? (
            <Grid item xs={12}>
              <Typography variant='body2' color='text.secondary'>
                {noItemsMessage}
              </Typography>
            </Grid>
          ) : (
            filteredInventory.map((item) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                lg={2}
                xl={2}
                key={item.FoodItemID}
                sx={{
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
                />
              </Grid>
            ))
          )}
        </Grid>
      </Box>
    </Box>
  );
};

export default Inventory;
