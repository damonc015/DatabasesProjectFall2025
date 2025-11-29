import React from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
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
    <Box sx={{ width: '100%', mb: 2, display: 'flex', justifyContent: 'center' }}>
      <Box
        className='categoryFilterContainer'
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 1, 
          width: '100%',
        }}
      >
        {categories.map((category) => (
          <Chip
            key={category}
            label={`${CATEGORY_EMOJI[category]} ${category}`}
            onClick={() => handleClick(category)}
            color={selectedCategory.includes(category) ? 'primary' : 'default'}
            variant={selectedCategory.includes(category) ? 'filled' : 'outlined'}
            size='small'
            clickable
          />
        ))}
      </Box>
    </Box>
  );
};

export default Filter;
