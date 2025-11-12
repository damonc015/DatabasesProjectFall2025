import React, { useState, useEffect } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { 
  Typography, 
  List,
  ListItem,
  Pagination,
  Divider,
  Box,
  IconButton
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

const Expiring = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(5);
  const [total, setTotal] = useState(0);
  
  const householdId = 1; // TODO: get household id from context

  const fetchTransactions = () => {
    setLoading(true);
    fetch(`/api/transactions/expiring/${householdId}?page=${page - 1}&limit=${rowsPerPage}`)
      .then(res => res.json())
      .then(result => {
        setTransactions(result.data);
        setTotal(result.total);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error:', error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, rowsPerPage, householdId]);

  const handleChangePage = (event, value) => {
    setPage(value);
  };

  const handleRefresh = () => {
    setPage(1);
    fetchTransactions();
  };

  const computeDateDiff = (targetDate) => {
    const diffMs = new Date(targetDate) - new Date();
    if (diffMs <= 0) return "expired";
    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) return `${days} day${days > 1 ? "s" : ""}${hours ? ` ${hours} hr` : ""}`;
    if (hours > 0) return `${hours} hr ${minutes} min`;
    return `${minutes} min`;
  }

  return (
    <div className='expiringContainer'>
      <Box display="flex" alignItems="center" gap={1} maxHeight='5vh'>
        <h1>Expiring</h1>
        <IconButton onClick={handleRefresh} disabled={loading} color="primary">
          <RefreshIcon />
        </IconButton>
      </Box>
      <Card className='cardContainer' variant='outlined'>
        <CardContent sx={{ maxHeight: '50vh', overflow: 'auto', p: 0.5 }}>
          <List dense disablePadding>
            {transactions.map((tx, index) => (
              <React.Fragment key={index}>
                <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body" fontWeight="bold" sx={{ flex: 1 }}>
                    {tx.QtyInBaseUnits}{tx.Abbreviation} {tx.Name} at {tx.LocationName} is expiring in {computeDateDiff(tx.ExpirationDate)}
                  </Typography>
                </ListItem>
                {index < transactions.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
          <Box display="flex" justifyContent="center" mt={0} pt={1} sx={{maxHeight: '8px', borderTop: 1, borderColor: 'divider'}}>
            <Pagination 
              count={Math.ceil(total / rowsPerPage)} 
              page={page} 
              onChange={handleChangePage}
              color="primary"
              size="small"
              disabled={loading}
            />
          </Box>
        </CardContent>
      </Card>
    </div>
  );
};

export default Expiring;