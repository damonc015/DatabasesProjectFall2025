import { useState } from 'react';
import Header from './Header';
import Inventory from './Inventory';
import Search from './Search';
import Filter from './Filter';
import Transactions from './Transactions';
import Expiring from './Expiring';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ShoppingList from './ShoppingList';
import useShoppingListStore from '../../stores/useShoppingListStore';

const Dashboard = () => {
  const { openModal } = useShoppingListStore();
  const [showPackage, setShowPackage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState([]);

  return (
    <div className='dashboard'>
      <Header />
      <div className='mainContentContainer'>
        <Search searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <Filter selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} />
        <div className='inventoryContainer'>
          <Inventory
            showPackage={showPackage}
            setShowPackage={setShowPackage}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
          />
        </div>
        <div className='monitorsContainer'>
          <Transactions showPackage={showPackage} />
          <Expiring showPackage={showPackage} />
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
    </div>
  );
};

export default Dashboard;
