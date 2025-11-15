import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { FoodIcon } from '../../../utils/foodEmojis';

const FoodCard = ({ item, showPackage }) => {
  return (
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
  );
};

export default FoodCard;

