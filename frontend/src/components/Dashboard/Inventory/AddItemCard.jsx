import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';

const AddItemCard = ({ onClick }) => {
  return (
    <Card 
      variant='outlined' 
      sx={{ 
        height: '14rem',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s',
        border: '2px dashed',
        borderColor: 'primary.main',
        '&:hover': {
          boxShadow: 3,
          cursor: 'pointer',
          borderColor: 'primary.dark'
        }
      }}
      onClick={onClick}
    >
      <CardContent 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          textAlign: 'center'
        }}
      >
        <AddIcon sx={{ fontSize: '3rem', color: 'primary.main', mb: 1 }} />
        <Typography variant='h6' sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Add Item
        </Typography>
      </CardContent>
    </Card>
  );
};

export default AddItemCard;

