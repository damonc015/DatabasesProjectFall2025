import { useState } from 'react';
import Header from './Header';
import Inventory from './Inventory';
import Search from './Search';
import Transactions from './Transactions';
import Expiring from './Expiring';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ModalContainer from './ShoppingList/ModalContainer';

const Dashboard = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className='dashboard'>
      <Header />
      <Search />
      <Inventory />
      <div className='monitorsContainer'>
        <Transactions />
        <Expiring />
        <Box className='actionButtonContainer'>
          <Fab className='actionButton' color='primary' aria-label='add shopping list' onClick={() => setModalOpen(prev => !prev)}>
            <AddShoppingCartIcon />
          </Fab>
        </Box>
        <ModalContainer open={modalOpen} onClose={() => setModalOpen(false)} />
      </div>
    </div>
  );
};

export default Dashboard;
