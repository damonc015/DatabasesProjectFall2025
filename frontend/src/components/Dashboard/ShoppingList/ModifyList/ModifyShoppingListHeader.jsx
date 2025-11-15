import React from 'react';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import useShoppingListStore from '../../../../stores/useShoppingListStore';
import dayjs from 'dayjs';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

export default function ModifyShoppingListHeader() {
  const { closeModal, setIsListHistory } = useShoppingListStore();
  // this will get the last updated date from db
  const lastUpdatedDate = dayjs(Date.now()).format('MM-DD-YYYY');
  return (
    <>
      <div className='shopping-list-pre-header'>
        <p>Last Updated: {lastUpdatedDate}</p>
      </div>
      <div className='shopping-list-header-container'>
        <div className='shopping-list-header'>
          <ArrowBackIcon className='muiicon' onClick={() => setIsListHistory('history')} />
          <h2>
            Shopping List <ShoppingCartIcon /> Created on: {lastUpdatedDate}
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
    </>
  );
}
