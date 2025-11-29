export const updateFoodItem = async (foodItemId, payload) => {
  const response = await fetch(`http://localhost:5001/api/food-items/${foodItemId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to update item metadata');
  }

  return response.json().catch(() => ({}));
};

export const createInventoryTransaction = async (payload) => {
  const response = await fetch('http://localhost:5001/api/transactions/inventory/transaction', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to create transaction');
  }

  return response.json();
};

export const archiveFoodItem = async (foodItemId) => {
  const response = await fetch(`http://localhost:5001/api/food-items/${foodItemId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to archive item');
  }

  return response.json().catch(() => ({}));
};


