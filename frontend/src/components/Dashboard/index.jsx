import { useState, useEffect } from 'react';
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
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { TRANSACTION_COMPLETED_EVENT } from '../../utils/transactionEvents';

const Dashboard = () => {
  const { openModal, setTempCreateListBelowThresholdItems, setTempCreateListAtThresholdItems } = useShoppingListStore();
  const [showPackage, setShowPackage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState([]);
  const queryClient = useQueryClient();
  const { householdId } = useCurrentUser();

  useEffect(() => {
    const handleTransactionCompleted = () => {
      // console.log('Transaction completed (Dashboard): Invalidating queries');
      queryClient.invalidateQueries(['itemsNotOnActiveList']);
      queryClient.invalidateQueries(['shoppingLists']);
      queryClient.invalidateQueries(['shoppingListItems']);
      queryClient.invalidateQueries(['foodItems']);
      queryClient.invalidateQueries(['inventory']);
    };

    window.addEventListener(TRANSACTION_COMPLETED_EVENT, handleTransactionCompleted);
    return () => {
      window.removeEventListener(TRANSACTION_COMPLETED_EVENT, handleTransactionCompleted);
    };
  }, [queryClient, householdId]);

  const handleOpenModal = () => {
    setTempCreateListBelowThresholdItems([]);
    setTempCreateListAtThresholdItems([]);
    openModal();
  };

  return (
    <div className='dashboard'>
      <Header />
      <div className='mainContentContainer'>
        <Search searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <div className='inventoryContainer'>
          <Inventory
            showPackage={showPackage}
            setShowPackage={setShowPackage}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        </div>
        <div className='monitorsContainer'>
          <Transactions showPackage={showPackage} />
          <Expiring showPackage={showPackage} />
          <Box className='actionButtonContainer'>
            <Fab className='actionButton' color='primary' aria-label='add shopping list' onClick={handleOpenModal}>
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
