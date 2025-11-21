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
} from '@mui/material';
import { useCurrentUser } from '../../../hooks/useCurrentUser';

const Transactions = ({ showPackage }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(5);
  const [total, setTotal] = useState(0);

  const user = useCurrentUser();

  const fetchTransactions = () => {
    setLoading(true);
    fetch(`/api/transactions/${user.householdId}?page=${page - 1}&limit=${rowsPerPage}`)
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

    // Set up interval to refresh data every 3 seconds
    const intervalId = setInterval(() => {
      fetchTransactions();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [page, rowsPerPage, user.householdId]);

  const handleChangePage = (event, value) => {
    setPage(value);
  };

  return (
    <div className='transactionsContainer'>
      <Box display="flex" alignItems="center" gap={1} maxHeight='5vh'>
        <h1>Transactions</h1>
      </Box>
      <Card className='cardContainer' variant='outlined' >
        <CardContent sx={{ display: 'flex', flexDirection: 'column', p: 1 }}>
          <Box sx={{ flex: 1 }}>
            <List dense disablePadding>
              {[...Array(rowsPerPage)].map((_, index) => {
                const tx = transactions[index];
                return (
                  <React.Fragment key={index}>
                    <ListItem sx={{ py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '40px' }}>
                      {tx ? (
                        <>
                          <Typography variant="body2" fontWeight="bold" sx={{ flex: 1, whiteSpace: 'nowrap' }}>
                            {tx.UserName} {tx.TransactionType}{tx.TransactionType === 'add' ? 'ed':'d'}{" "}
                            {showPackage ? tx.FormattedPackages : `${Math.round(tx.QtyInTotal)}${tx.BaseUnitAbbr}`} of {tx.FoodName} at {tx.LocationName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', ml: 2 }}>
                            {new Date(tx.CreatedAt).toLocaleString()}
                          </Typography>
                        </>
                      ) : (
                        index === 0 && transactions.length === 0 && !loading ? (
                          <Typography variant="body2" color="text.secondary">
                            No transactions found
                          </Typography>
                        ) : (
                          <Typography variant="body2" sx={{ visibility: 'hidden' }}>-</Typography>
                        )
                      )}
                    </ListItem>
                    {index < rowsPerPage - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          </Box>
          <Box display="flex" justifyContent="center" alignItems="center" pt={3} sx={{ maxHeight: '2vh', borderTop: 1, borderColor: 'divider' }}>
            <Pagination
              count={Math.ceil(total / rowsPerPage)}
              page={page}
              onChange={handleChangePage}
              color="primary"
              size="small"
              //disabled={loading}
            />
          </Box>
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;
