import { useState } from 'react';
import { useFoodItems } from '../../hooks/useFoodItems';
import './DBTest.scss';

const DBTest = () => {
  const { items, error: itemsError, loading } = useFoodItems();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [foodItemId, setFoodItemId] = useState('1');

  const testConnection = async () => {
    setData(null);
    setError(null);
    try {
      const res = await fetch(`/api/food-items/${foodItemId}`);
      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error || `Item not found (ID: ${foodItemId})`);
        return;
      }
      const data = await res.json();
      setData(data);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
  if (itemsError) return <div style={{ padding: '20px' }}>Error: {itemsError}</div>;
  if (!items) return null;

  return (
    <div className="db-test">
      <h1>DB Test</h1>
      
      <div className="success-box">
        <strong>Success! Database connected.</strong>
      </div>
      
      <div className="items-list">
        <strong>Available Food Items:</strong>
        <ul>
          {items.map(item => (
            <li key={item.FoodItemID}>
              <strong>ID {item.FoodItemID}:</strong> {item.Name}
            </li>
          ))}
        </ul>
      </div>

      <div className="input-section">
        <label>
          Food Item ID:
          <input
            type="text"
            value={foodItemId}
            onChange={(e) => setFoodItemId(e.target.value)}
          />
        </label>
        <button onClick={testConnection}>
          Test Connection
        </button>
      </div>

      {error && (
        <div className="error-box">
          <strong>DB Reponse:</strong> {error}
        </div>
      )}

      {data && (
        <pre className="json-display">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default DBTest;

