import React from 'react'
import SearchIcon from '@mui/icons-material/Search';
import TextField from '@mui/material/TextField';

const Search = () => {
  return (
    <div className='searchContainer'>
      <SearchIcon />
      <TextField className='input' label='Search' variant='outlined' placeholder='Search for an item' />
    </div>
  )
}

export default Search