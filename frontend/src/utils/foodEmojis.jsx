// TODO ? use SVGs instead of emojis?

export const CATEGORY_EMOJI = {
  Produce: '🥦',
  Dairy: '🥛',
  Meat: '🍗',
  Grain: '🍞',
  Frozen: '🧊',
  Fruit: '🍎',
  Vegetable: '🥕',
  Protein: '🍗',
  Bread: '🍞',
  Beverage: '🥤',
  Snack: '🍪',
  Condiment: '🧂',
};

export function FoodIcon({ category }) {
  if (!category) return <span style={{ fontSize: '3rem' }}>🍽️</span>;
  
  const capitalizedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  const emoji = CATEGORY_EMOJI[capitalizedCategory] ?? '🍽️';
  return <span style={{ fontSize: '3rem' }}>{emoji}</span>;
}

