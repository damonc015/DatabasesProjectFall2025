import React from 'react';
import CloseIcon from '@mui/icons-material/Close';
import useShoppingListStore from '../../../../stores/useShoppingListStore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ListIcon from '@mui/icons-material/List';

export default function ShoppingHistoryHeader() {
  const { closeModal, setIsListHistory } = useShoppingListStore();
  return (
    <div className='shopping-list-header-container'>
      <div className='shopping-list-header'>
        <ArrowBackIcon className='muiicon' onClick={() => setIsListHistory('createlist')} />
        <h2>
          Shopping List Log <ListIcon />
        </h2>
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
