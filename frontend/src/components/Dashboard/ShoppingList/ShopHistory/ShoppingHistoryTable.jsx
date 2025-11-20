import { useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import useShoppingListStore from '../../../../stores/useShoppingListStore';
import Button from '@mui/material/Button';
import DownloadIcon from '@mui/icons-material/Download';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useShoppingLists } from '../../../../hooks/useShoppingLists';

export default function ShoppingHistoryTable() {
  const { setIsListHistory, setActiveListId } = useShoppingListStore();
  // Download states
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedListId, setSelectedListId] = useState(null);
  // 0 - ShoppingListID, 1 - LastUpdated, 2 - Status, 3 - TotalCost
  const [sortParam, setSortParam] = useState(0);
  const [sortOrder, setSortOrder] = useState('asc');
  // Shooping List Query
  const { data, error, isLoading } = useShoppingLists({ param: sortParam, order: sortOrder });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No data found</div>;

  const tableHeaders = [
    { label: 'ListID', align: 'left' },
    { label: 'Date', align: 'left' },
    { label: 'Status', align: 'left' },
    { label: 'Total Spent', align: 'left' },
    { label: 'Download', align: 'left' },
  ];

  const handleShoppingListParamSort = (index) => {
    // 0 - ShoppingListID, 1 - LastUpdated, 2 - Status, 3 - TotalCost
    if (index === sortParam) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortParam(index);
    }
  };

  const handleOpenMenu = (event, listId) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedListId(listId);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleDownload = (format) => {
    const url = `/api/shopping-lists/${selectedListId}/export?format=${format}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `shopping_list_${selectedListId}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    handleCloseMenu();
  };

  console.log(data);
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label='simple table'>
        <TableHead>
          <TableRow>
            {tableHeaders.map((header, index) =>
              index === tableHeaders.length - 1 ? (
                <TableCell
                  key={header.label}
                  align='center'
                  sx={{
                    fontWeight: 'bold',
                    fontFamily: 'Balsamiq Sans',
                  }}
                >
                  <span className='shopping-history-table-header'>{header.label}</span>
                </TableCell>
              ) : (
                <TableCell
                  key={header.label}
                  align='center'
                  onClick={() => handleShoppingListParamSort(index)}
                  sx={{
                    fontWeight: 'bold',
                    fontFamily: 'Balsamiq Sans',
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)', cursor: 'pointer' },
                  }}
                >
                  <span className='shopping-history-table-header'>
                    {header.label}
                    <UnfoldMoreIcon className='muiicon-noshadow' />
                  </span>
                </TableCell>
              )
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow
              key={row.ShoppingListID}
              onClick={() => {
                setActiveListId(row.ShoppingListID);
                setIsListHistory('modifylist');
              }}
              sx={{
                '&:last-child td, &:last-child th': { border: 0 },
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)', cursor: 'pointer' },
              }}
            >
              <TableCell component='th' scope='row' align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                {row.ShoppingListID}
              </TableCell>
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                {row.LastUpdated}
              </TableCell>
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                {row.Status.toString().toUpperCase()}
              </TableCell>
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                {row.TotalCost ? `$${row.TotalCost}` : '$0.00'}
              </TableCell>
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                <Button
                  className='table-button'
                  variant='contained'
                  color='primary'
                  endIcon={<DownloadIcon />}
                  onClick={(e) => handleOpenMenu(e, row.ShoppingListID)}
                >
                  Download
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
        <MenuItem onClick={() => handleDownload('json')}>Download as JSON</MenuItem>
        <MenuItem onClick={() => handleDownload('html')}>Download as HTML</MenuItem>
      </Menu>
    </TableContainer>
  );
}
