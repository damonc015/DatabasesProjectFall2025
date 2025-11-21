import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import useShoppingListStore from '../../../stores/useShoppingListStore';
import CreateShoppingListHeader from './CreateList/CreateShoppingListHeader';
import CreateShoppingListTable from './CreateList/CreateShoppingListTable';
import CreateShoppingListButton from './CreateList/CreateShoppingListButton';
import ModifyShoppingListHeader from './ModifyList/ModifyShoppingListHeader';
import ModifyShoppingListTable from './ModifyList/ModifyShoppingListTable';
import ShoppingHistoryHeader from './ShopHistory/ShoppingHistoryHeader';
import ShoppingHistoryTable from './ShopHistory/ShoppingHistoryTable';

export default function ModalContainer() {
  const { isModalOpen, closeModal, isListHistory, setIsListHistory } = useShoppingListStore();
  const displayModalContent = () => {
    switch (isListHistory) {
      case 'history':
        return (
          <Box className='alt-box'>
            <ShoppingHistoryHeader />
            <ShoppingHistoryTable />
          </Box>
        );
      case 'createlist':
        return (
          <Box className='box'>
            <div className='shopping-list-container'>
              <CreateShoppingListHeader />
              <CreateShoppingListTable />
            </div>
            <CreateShoppingListButton />
          </Box>
        );
      case 'modifylist':
        return (
          <Box className='box'>
            <div className='shopping-list-container'>
              <ModifyShoppingListHeader />
              <ModifyShoppingListTable />
            </div>
            <Button
              className='button'
              variant='contained'
              color='primary'
              onClick={() => {
                closeModal();
                setIsListHistory('createlist');
              }}
            >
              Save Changes
            </Button>
          </Box>
        );
      default:
        return <Box></Box>;
    }
  };
  return (
    <Modal
      open={isModalOpen}
      onClose={() => {
        closeModal();
        setIsListHistory('createlist');
      }}
      className='modalContainer'
      aria-labelledby='modal-modal-title'
      aria-describedby='modal-modal-description'
    >
      {displayModalContent()}
    </Modal>
  );
}
