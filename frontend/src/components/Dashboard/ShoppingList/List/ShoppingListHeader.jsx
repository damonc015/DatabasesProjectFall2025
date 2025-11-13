import React from 'react';
import CloseIcon from '@mui/icons-material/Close';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import useShoppingListStore from '../../../../stores/useShoppingListStore';
import dayjs from 'dayjs';

const ShoppingListHeader = () => {
  const { closeModal, setIsListHistory } = useShoppingListStore();
  // this will get the last updated date from db 
  const lastUpdatedDate = dayjs(Date.now()).format('MM-DD-YYYY');
  return (
    <div className='shopping-list-header-container'>
      <div className='shopping-list-pre-header'>
        <p>Last Updated: {lastUpdatedDate}</p>
        <CloseIcon className='muiicon' onClick={closeModal} />
      </div>
      <div className='shopping-list-header'>
        <div>
          <h2>Shopping List</h2>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DemoContainer components={['DatePicker']}>
              <DatePicker label='Initial Date' />
            </DemoContainer>
          </LocalizationProvider>
        </div>
        <div>
          <span>View List History</span>
          <CalendarMonthIcon className='muiicon' onClick={() => setIsListHistory(true)} />
        </div>
      </div>
    </div>
  );
};

export default ShoppingListHeader;
