import { useState } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { useCurrentUser } from '../../../../hooks/useCurrentUser';
import { CATEGORY_EMOJI } from '../../../../utils/foodEmojis';
import { INITIAL_FORM_STATE } from './constants';
import { useFormData } from './useFormData';
import { useSubmitForm } from './useSubmitForm';
import { validateForm } from './validation';
import { LeftColumnFields, RightColumnFields } from './FormFields';

const AddFoodItemModal = ({ open, onClose, onItemAdded }) => {
  const { householdId, user } = useCurrentUser();
  const userId = user?.id;
  
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [error, setError] = useState('');
  const [addAnother, setAddAnother] = useState(false);

  const { locations, baseUnits, packageLabels } = useFormData(open, householdId);
  const { submitForm, loading, error: submitError, setError: setSubmitError } = useSubmitForm(householdId, userId, onItemAdded, onClose);

  const categories = Object.keys(CATEGORY_EMOJI);

  const handleChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    setError('');
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_STATE);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitError('');
    
    const validationError = validateForm(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const newFormData = await submitForm(formData, addAnother);
      setFormData(newFormData);
      setAddAnother(false);
    } catch (err) {
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="add-food-item-modal"
      aria-describedby="add-food-item-form"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: '80%', md: '800px' },
          maxHeight: '90vh',
          overflowY: 'auto',
          bgcolor: 'background.paper',
          border: '2px solid',
          borderColor: 'divider',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography id="add-food-item-modal" variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
            Add New Item
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {(error || submitError) && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
            <Typography color="error" variant="body2">{error || submitError}</Typography>
          </Box>
        )}

        <Box component="form" onSubmit={handleSubmit} id="add-food-item-form">
          <Grid container spacing={3} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <LeftColumnFields
                  formData={formData}
                  handleChange={handleChange}
                  locations={locations}
                  categories={categories}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <RightColumnFields
                  formData={formData}
                  handleChange={handleChange}
                  baseUnits={baseUnits}
                  packageLabels={packageLabels}
                />
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
              fullWidth
              onClick={() => setAddAnother(false)}
            >
              {loading ? 'Adding...' : 'Save & Add Item'}
            </Button>
            <Button 
              type="submit" 
              variant="outlined" 
              disabled={loading}
              fullWidth
              onClick={() => setAddAnother(true)}
            >
              {loading ? 'Adding...' : 'Save & Add Another Item'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default AddFoodItemModal;

