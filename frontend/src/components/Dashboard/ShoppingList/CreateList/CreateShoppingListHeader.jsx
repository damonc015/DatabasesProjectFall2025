import React from 'react';
import CloseIcon from '@mui/icons-material/Close';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import useShoppingListStore from '../../../../stores/useShoppingListStore';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

export default function CreateShoppingListHeader() {
  const { closeModal, setIsListHistory } = useShoppingListStore();
  const currentDate = dayjs().format('MM-DD-YYYY');
  return (
    <div className='shopping-list-header-container'>
      <div className='shopping-list-header'>
        <h2>
          <ShoppingCartIcon />
          Create New Shopping List - {currentDate}
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
