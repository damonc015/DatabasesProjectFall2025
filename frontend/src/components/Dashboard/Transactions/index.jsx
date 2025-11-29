import React, { useState, useEffect, useCallback } from 'react';
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
import { capitalizeWords, formatQuantityDisplay } from '../../../utils/formatters';

const formatLocationName = (name) => {
  if (!name) {
    return 'Unknown location';
  }
  return capitalizeWords(name);
};

const renderTransactionText = (tx, showPackage) => {
  const quantityText = formatQuantityDisplay(tx, showPackage);
  const foodName = capitalizeWords(tx.FoodName);

  const isTransferOut = tx.TransactionType === 'transfer_out';
  const isTransferIn = tx.TransactionType === 'transfer_in';

  if (isTransferOut || isTransferIn) {
    const source = isTransferOut ? tx.LocationName : tx.CounterLocationName;
    const destination = isTransferOut ? tx.CounterLocationName : tx.LocationName;
    return `${tx.DisplayName} moved ${quantityText} of ${foodName} from ${formatLocationName(source)} to ${formatLocationName(destination)}`;
  }

  const verbMap = {
    add: 'added',
    remove: 'removed',
    expire: 'expired',
    purchase: 'purchased',
  };

  const verb = verbMap[tx.TransactionType] || `${tx.TransactionType}${tx.TransactionType?.endsWith('e') ? 'd' : 'ed'}`;

  return `${tx.DisplayName} ${verb} ${quantityText} of ${foodName} at ${formatLocationName(tx.LocationName)}`;
};

const Transactions = ({ showPackage }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(5);
  const [total, setTotal] = useState(0);

  const user = useCurrentUser();

  const fetchTransactions = useCallback(() => {
    if (!user.householdId) return;

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
  }, [page, rowsPerPage, user.householdId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    const handleTransactionCompleted = () => {
      fetchTransactions();
    };

    window.addEventListener('transactionCompleted', handleTransactionCompleted);

    return () => {
      window.removeEventListener('transactionCompleted', handleTransactionCompleted);
    };
  }, [fetchTransactions]);

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
                            {renderTransactionText(tx, showPackage)}
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
