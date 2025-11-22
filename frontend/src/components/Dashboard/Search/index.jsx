import React, { useState, useEffect } from 'react'
import SearchIcon from '@mui/icons-material/Search';
import TextField from '@mui/material/TextField';

const Search = ({ searchQuery, setSearchQuery }) => {
  const [inputValue, setInputValue] = useState(searchQuery || '');

  useEffect(() => {
    setInputValue(searchQuery || '');
  }, [searchQuery]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      setSearchQuery(inputValue.trim());
    }
  };

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  return (
    <div className='searchContainer'>
      <SearchIcon />
      <TextField
        className='input'
        label='Search'
        variant='outlined'
        placeholder='Search for an item (press Enter)'
        value={inputValue}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
      />
    </div>
  )
}

export default Search
