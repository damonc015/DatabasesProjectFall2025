import { useState } from 'react';
import { useFoodItems } from '../../hooks/useFoodItems';
import './DBTest.scss';

const DBTest = () => {
  const { data: items, error: itemsError, isLoading } = useFoodItems();
  const [singleItemData, setSingleItemData] = useState(null);
  const [testError, setTestError] = useState(null);
  const [foodItemId, setFoodItemId] = useState('1');

  const testConnection = async () => {
    setSingleItemData(null);
    setTestError(null);
    try {
      const res = await fetch(`/api/food-items/${foodItemId}`);
      if (!res.ok) {
        const errorData = await res.json();
        setTestError(errorData.error || `Item not found (ID: ${foodItemId})`);
        return;
      }
      const data = await res.json();
      setSingleItemData(data);
    } catch (err) {
      setTestError(err.message);
    }
  };

  if (isLoading) return <div style={{ padding: '20px' }}>Loading...</div>;
  if (itemsError) return <div style={{ padding: '20px' }}>Error: {itemsError.message}</div>;
  if (!items) return null;

  return (
    <div className='db-test'>
      <h1>DB Test</h1>

      <div className='success-box'>
        <strong>Success! Database connected.</strong>
      </div>

      <div className='items-list'>
        <strong>Available Food Items:</strong>
        <ul>
          {items.map((item) => (
            <li key={item.FoodItemID}>
              <strong>ID {item.FoodItemID}:</strong> {item.Name}
            </li>
          ))}
        </ul>
      </div>

      <div className='input-section'>
        <label>
          Food Item ID:
          <input type='text' value={foodItemId} onChange={(e) => setFoodItemId(e.target.value)} />
        </label>
        <button onClick={testConnection}>Test Connection</button>
      </div>

      {testError && (
        <div className='error-box'>
          <strong>DB Reponse:</strong> {testError}
        </div>
      )}

      {singleItemData && <pre className='json-display'>{JSON.stringify(singleItemData, null, 2)}</pre>}
    </div>
  );
};

export default DBTest;
