import { useState } from 'react';
import { dispatchTransactionCompleted } from '../../../../utils/transactionEvents';
import { INITIAL_FORM_STATE } from './constants';

export const useSubmitForm = (householdId, userId, onItemAdded, onClose) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submitForm = async (formData, addAnother) => {
    setError('');
    setLoading(true);

    console.log(formData);

    try {
      const targetLevelInBaseUnits = parseFloat(formData.target_level) * parseFloat(formData.package_base_unit_amt);

      const response = await fetch('/api/food-items/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          food_name: formData.food_name.toLowerCase().trim(),
          type: (formData.type || '').toLowerCase().trim(),
          category: formData.category.toLowerCase().trim(),
          base_unit_id: parseInt(formData.base_unit_id),
          household_id: householdId,
          location_id: parseInt(formData.location_id),
          package_label: formData.package_label.toLowerCase().trim(),
          package_base_unit_amt: parseFloat(formData.package_base_unit_amt),
          target_level: targetLevelInBaseUnits,
          quantity: parseInt(formData.quantity),
          user_id: userId,
          expiration_date: formData.expiration_date || null,
          price_per_item: formData.price_per_item ? parseFloat(formData.price_per_item) : null,
          store: formData.store ? formData.store.toLowerCase().trim() : null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Couldn\'t add item.');
      }

      dispatchTransactionCompleted();

      if (onItemAdded) {
        onItemAdded();
      }

      if (!addAnother) {
        onClose();
      }

      return INITIAL_FORM_STATE;
    } catch (err) {
      console.error('Error adding food item:', err);
      setError(err.message || 'Couldn\'t add item. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { submitForm, loading, error, setError };
};

