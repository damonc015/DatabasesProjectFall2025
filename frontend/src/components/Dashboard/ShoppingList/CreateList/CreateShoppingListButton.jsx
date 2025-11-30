import React from 'react';
import useShoppingListStore from '../../../../stores/useShoppingListStore';
import Button from '@mui/material/Button';

const CreateShoppingListButton = () => {
  const { setIsMiniModalOpen } = useShoppingListStore();

  const handleSaveUpdates = () => {
    setIsMiniModalOpen(true);
  };
  return (
    <>
      <Button className='button' variant='contained' color='primary' onClick={handleSaveUpdates}>
        Save Updates
      </Button>
    </>
  );
};

export default CreateShoppingListButton;
