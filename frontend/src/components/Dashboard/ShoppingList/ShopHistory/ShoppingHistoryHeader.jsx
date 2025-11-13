import React from 'react';
import CloseIcon from '@mui/icons-material/Close';
import useShoppingListStore from '../../../../stores/useShoppingListStore';

const ShoppingHistoryHeader = () => {
  const { closeModal, setIsListHistory } = useShoppingListStore();
  return (
    <div className='shopping-list-header-container'>
      <div className='shopping-list-pre-header'>
        <h2>Shopping List Log</h2>
        <CloseIcon
          className='muiicon'
          onClick={() => {
            closeModal();
            setIsListHistory(false);
          }}
        />
      </div>
    </div>
  );
};

export default ShoppingHistoryHeader;
