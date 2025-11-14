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

function createData(name, calories, fat, carbs, protein) {
  return { name, calories, fat, carbs, protein };
}

const tableHeaders = [
  { label: 'ListID', align: 'left' },
  { label: 'Date', align: 'left' },
  { label: 'Total Spent', align: 'left' },
  { label: 'Download', align: 'left' },
];
const suggestedRows = [
  { name: 'Frozen yoghurt', calories: 159, fat: 6.0, carbs: 24, protein: 4.0 },
  { name: 'Ice cream sandwich', calories: 237, fat: 9.0, carbs: 37, protein: 4.3 },
  { name: 'Eclair', calories: 262, fat: 16.0, carbs: 24, protein: 6.0 },
  { name: 'Cupcake', calories: 305, fat: 3.7, carbs: 67, protein: 4.3 },
  { name: 'Gingerbread', calories: 356, fat: 16.0, carbs: 49, protein: 3.9 },
];
const rows = [
  createData('Frozen yoghurt', 159, 6.0, 24, 4.0),
  createData('Ice cream sandwich', 237, 9.0, 37, 4.3),
  createData('Eclair', 262, 16.0, 24, 6.0),
  createData('Cupcake', 305, 3.7, 67, 4.3),
  createData('Gingerbread', 356, 16.0, 49, 3.9),
];
export default function ShoppingHistoryTable() {
  const { setIsListHistory } = useShoppingListStore();
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
          {suggestedRows.map((row) => (
            <TableRow
              key={row.name}
              onClick={() => setIsListHistory('modifylist')}
              sx={{
                '&:last-child td, &:last-child th': { border: 0 },
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)', cursor: 'pointer' },
              }}
            >
              <TableCell component='th' scope='row' align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                {row.name}
              </TableCell>
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                {row.calories}
              </TableCell>
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                {row.fat}
              </TableCell>
              <TableCell align='center' sx={{ fontFamily: 'Balsamiq Sans' }}>
                <Button className='table-button' variant='contained' color='primary' endIcon={<DownloadIcon />}>
                  Download
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
