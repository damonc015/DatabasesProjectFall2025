// TODO ? use SVGs instead of emojis?

export const CATEGORY_EMOJI = {
  Produce: '🍎',
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
  const emoji = CATEGORY_EMOJI[category] ?? '🍽️';
  return <span style={{ fontSize: '3rem' }}>{emoji}</span>;
}

