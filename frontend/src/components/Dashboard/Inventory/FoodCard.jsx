import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { FoodIcon } from '../../../utils/foodEmojis';

const capitalize = (str) => {
  if (!str) return '';
  return str.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

const FoodCard = ({ item, showPackage, userId, locationId, onTransactionComplete }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleTransaction = async (transactionType) => {
    if (!userId) {
      alert('Error: User ID is missing. Please log in again.');
      console.error('Missing userId');
      return;
    }
    
    if (!locationId) {
      alert('Error: Location ID is missing. Please select a location.');
      console.error('Missing locationId');
      return;
    }

    setIsLoading(true);
    
    // The quick add/remove uses the package amount to increase/decrease.
    const quantity = item.QtyPerPackage && item.QtyPerPackage > 0 
      ? item.QtyPerPackage 
      : 1;

    try {
      const response = await fetch('http://localhost:5001/api/transactions/inventory/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          food_item_id: item.FoodItemID,
          location_id: locationId,
          user_id: userId,
          transaction_type: transactionType,
          quantity: quantity,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('API Error:', error);
        throw new Error(error.error || 'Failed to create transaction');
      }

      const result = await response.json();
      console.log('Transaction created:', result);

      if (onTransactionComplete) {
        setTimeout(() => {
          onTransactionComplete();
        }, 0);
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleTransaction('add');
  };

  const handleRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleTransaction('remove');
  };

  return (
    <Card 
      variant='outlined' 
      sx={{ 
        height: '14rem',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s',
        overflow: 'hidden',
        '&:hover': {
          boxShadow: 3,
          cursor: 'pointer'
        }
      }}
    >
      <CardContent 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          textAlign: 'center', 
          overflow: 'hidden'
        }}
      >
        <FoodIcon category={item.Category} />
        <Typography variant='h6' sx={{ mb: 1, mt: 1, fontWeight: 'bold' }}>
          {capitalize(item.FoodName)}
        </Typography>
        <Typography variant='body1' sx={{ mb: 2, color: 'text.secondary' }}>
          {showPackage ? item.FormattedPackages : item.FormattedBaseUnits}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 'auto' }}>
          <IconButton 
            size='small' 
            color='primary' 
            onClick={handleRemove}
            disabled={isLoading}
          >
            <RemoveIcon />
          </IconButton>
          <IconButton 
            size='small' 
            color='primary' 
            onClick={handleAdd}
            disabled={isLoading}
          >
            <AddIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};

export default FoodCard;

