import React from 'react';
import CloseIcon from '@mui/icons-material/Close';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import useShoppingListStore from '../../../../stores/useShoppingListStore';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

export default function CreateShoppingListHeader() {
  const { closeModal, setIsListHistory } = useShoppingListStore();
  return (
    <div className='shopping-list-header-container'>
      <div className='shopping-list-header'>
        <h2>
          Create New Shopping List <ShoppingCartIcon />
        </h2>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DemoContainer components={['DatePicker']}>
            <DatePicker label='Initial Date' />
          </DemoContainer>
        </LocalizationProvider>
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
