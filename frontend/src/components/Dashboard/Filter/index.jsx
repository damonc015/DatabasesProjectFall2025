import React from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { CATEGORY_EMOJI } from '../../../utils/foodEmojis';

const Filter = ({ selectedCategory, setSelectedCategory }) => {
  const categories = Object.keys(CATEGORY_EMOJI);

  const handleClick = (category) => {
    if (selectedCategory.includes(category)) {
      setSelectedCategory(selectedCategory.filter((c) => c !== category));
    } else {
      setSelectedCategory([...selectedCategory, category]);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, p: 1, justifyContent: 'center' }}>
      {categories.map((category) => (
        <Chip
          key={category}
          label={`${CATEGORY_EMOJI[category]} ${category}`}
          onClick={() => handleClick(category)}
          color={selectedCategory.includes(category) ? 'primary' : 'default'}
          variant={selectedCategory.includes(category) ? 'filled' : 'outlined'}
          clickable
        />
      ))}
    </Box>
  );
};

export default Filter;
