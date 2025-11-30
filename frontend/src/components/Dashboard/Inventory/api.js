import { dispatchTransactionCompleted } from '../../../utils/transactionEvents';

export const updateFoodItem = async (foodItemId, payload) => {
  const response = await fetch(`/api/food-items/${foodItemId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to update item metadata');
  }

  return response.json().catch(() => ({}));
};

export const createInventoryTransaction = async (payload, { notify = true } = {}) => {
  const response = await fetch('/api/transactions/inventory/transaction', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to create transaction');
  }

  const data = await response.json();

  if (notify) {
    dispatchTransactionCompleted({ payload, data });
  }

  return data;
};

export const archiveFoodItem = async (foodItemId) => {
  const response = await fetch(`/api/food-items/${foodItemId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to archive item');
  }

  return response.json().catch(() => ({}));
};


