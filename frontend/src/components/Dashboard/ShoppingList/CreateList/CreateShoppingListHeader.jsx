import React from 'react';
import CloseIcon from '@mui/icons-material/Close';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import useShoppingListStore from '../../../../stores/useShoppingListStore';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

export default function CreateShoppingListHeader() {
  const { closeModal, setIsListHistory } = useShoppingListStore();
  return (
    <div className='shopping-list-header-container'>
      <div className='shopping-list-header'>
        <h2>
          <ShoppingCartIcon />
          Current Shopping List
        </h2>

        <div>
          <span>View List History</span>
          <CalendarMonthIcon className='muiicon' onClick={() => setIsListHistory('history')} />
        </div>
      </div>
      <CloseIcon
        className='muiicon'
        onClick={() => {
          closeModal();
          setIsListHistory('createlist');
        }}
      />
    </div>
  );
}
