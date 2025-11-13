import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import useShoppingListStore from '../../../stores/useShoppingListStore';
import ShoppingListHeader from './List/ShoppingListHeader';
import ShoppingListTable from './List/ShoppingListTable';
import ShoppingHistoryHeader from './ShopHistory/ShoppingHistoryHeader';
import ShoppingHistoryTable from './ShopHistory/ShoppingHistoryTable';

export default function ModalContainer() {
  const { isModalOpen, closeModal, isListHistory, setIsListHistory } = useShoppingListStore();
  return (
    <Modal
      open={isModalOpen}
      onClose={() => {
        closeModal();
        setIsListHistory(false);
      }}
      className='modalContainer'
      aria-labelledby='modal-modal-title'
      aria-describedby='modal-modal-description'
    >
      {isListHistory ? (
        <Box className='alt-box'>
          <ShoppingHistoryHeader />
          <ShoppingHistoryTable />
        </Box>
      ) : (
        <Box className='box'>
          <div className='shopping-list-container'>
            <ShoppingListHeader />
            <ShoppingListTable />
          </div>
          <Button className='button' variant='contained' color='primary' onClick={closeModal}>
            Create New List
          </Button>
        </Box>
      )}
    </Modal>
  );
}
