import React from 'react'
import SearchIcon from '@mui/icons-material/Search';
import TextField from '@mui/material/TextField';

const Search = ({ searchQuery, setSearchQuery }) => {
  return (
    <div className='searchContainer'>
      <SearchIcon />
      <TextField
        className='input'
        label='Search'
        variant='outlined'
        placeholder='Search for an item'
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  )
}

export default Search
