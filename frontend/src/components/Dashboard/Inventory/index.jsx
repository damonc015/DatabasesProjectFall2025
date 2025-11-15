import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { FoodIcon } from '../../../utils/foodEmojis';
import { useCurrentUser } from '../../../hooks/useCurrentUser';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPackage, setShowPackage] = useState(false);
  const [locationFilter, setLocationFilter] = useState(null);
  
  const { householdId } = useCurrentUser();

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

  useEffect(() => {
    if (!householdId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const url = locationFilter === null
      ? `http://localhost:5001/api/transactions/inventory/${householdId}`
      : `http://localhost:5001/api/transactions/inventory/${householdId}/location/${locationFilter}`;
    
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
  }, [householdId, locationFilter]);

  if (loading) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, width: '100%' }}>
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

      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={2}>
          {inventory.length === 0 ? (
            <Grid item xs={12}>
              <Typography variant='body2' color='text.secondary'>
                No items in inventory.
              </Typography>
            </Grid>
          ) : (
            inventory.map((item) => (
              <Grid item xs={6} sm={4} md={3} lg={2} xl={2} key={item.FoodItemID}>
                <Card 
                  variant='outlined' 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'box-shadow 0.2s',
                    '&:hover': {
                      boxShadow: 3,
                      cursor: 'pointer'
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <FoodIcon category={item.Category} />
                    <Typography variant='h6' sx={{ mb: 1, mt: 1, fontWeight: 'bold' }}>
                      {item.FoodName}
                    </Typography>
                    <Typography variant='body1' sx={{ mb: 2, color: 'text.secondary' }}>
                      {showPackage ? item.FormattedPackages : item.FormattedBaseUnits}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 'auto' }}>
                      <IconButton size='small' color='primary'>
                        <RemoveIcon />
                      </IconButton>
                      <IconButton size='small' color='primary'>
                        <AddIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Box>
    </Box>
  );
};

export default Inventory;
