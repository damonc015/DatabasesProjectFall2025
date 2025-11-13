import Header from './Header';
import Inventory from './Inventory';
import Search from './Search';
import Transactions from './Transactions';
import Expiring from './Expiring';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ShoppingList from './ShoppingList';
import useShoppingListStore from '../../stores/useShoppingListStore';

const Dashboard = () => {
  const { openModal } = useShoppingListStore();
  return (
    <div className='dashboard'>
      <Header />
      <Search />
      <Inventory />
      <div className='monitorsContainer'>
        <Transactions />
        <Expiring />
        <Box className='actionButtonContainer'>
          <Fab
            className='actionButton'
            color='primary'
            aria-label='add shopping list'
            onClick={openModal}
          >
            <AddShoppingCartIcon />
          </Fab>
        </Box>
        <ShoppingList />
      </div>
    </div>
  );
};

export default Dashboard;
