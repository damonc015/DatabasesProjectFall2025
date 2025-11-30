import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import EditIcon from '@mui/icons-material/Edit';
import { FoodIcon } from '../../../utils/foodEmojis';
import { capitalizeWords } from '../../../utils/formatters';
import { createInventoryTransaction } from './api';

const FoodCard = ({ item, showPackage, userId, locationId, onTransactionComplete, onEdit, onRestock }) => {
  const [isLoading, setIsLoading] = useState(false);

  const fetchLatestExpiration = async () => {
    try {
      const res = await fetch(`/api/transactions/food-item/${item.FoodItemID}/latest-expiration`, {
        credentials: 'include',
      });
      if (!res.ok) {
        await res.json().catch(() => ({}));
        return null;
      }
      const data = await res.json();
      return data?.expiration_date || null;
    } catch (err) {
      console.error('Quick add expiration fetch error:', err);
      return null;
    }
  };

  const getDefaultExpiration = () => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().split('T')[0];
  };

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
    
    const quantity = item.QtyPerPackage && item.QtyPerPackage > 0 
      ? item.QtyPerPackage 
      : 1;

    try {
      let expirationDate;
      if (transactionType === 'add') {
        expirationDate = await fetchLatestExpiration();
        if (!expirationDate) {
          expirationDate = getDefaultExpiration();
        }
      }

      const payload = {
        food_item_id: item.FoodItemID,
        location_id: locationId,
        user_id: userId,
        transaction_type: transactionType,
        quantity,
        ...(transactionType === 'add' && expirationDate ? { expiration_date: expirationDate } : {})
      };

      await createInventoryTransaction(payload);

      if (onTransactionComplete) {
        setTimeout(() => {
          onTransactionComplete();
        }, 0);
      }
    } catch (error) {
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

  const isOutOfStock =
    item.TotalQtyInBaseUnits !== undefined &&
    item.TotalQtyInBaseUnits !== null &&
    Number(item.TotalQtyInBaseUnits) === 0;

  return (
    <Card 
      variant='outlined' 
      sx={{ 
        minHeight: '17.5rem',
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s, opacity 0.2s, filter 0.2s',
        overflow: 'hidden',
        opacity: isOutOfStock ? 0.5 : 1,
        filter: isOutOfStock ? 'grayscale(0.6)' : 'none',
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
        {onEdit && (
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
            <Tooltip title="Edit item">
              <IconButton
                size='small'
                color='default'
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit(item);
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        <FoodIcon category={item.Category} />
        <Typography variant='h6' sx={{ mb: 1, mt: 1, fontWeight: 'bold' }}>
          {capitalizeWords(item.FoodName)}
        </Typography>
        <Typography variant='body1' sx={{ mb: 2, color: 'text.secondary' }}>
          {showPackage ? item.FormattedPackages : item.FormattedBaseUnits}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%', mt: 'auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
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
          {onRestock && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                size="small"
                variant="outlined"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRestock(item);
                }}
              >
                Stock
              </Button>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default FoodCard;

