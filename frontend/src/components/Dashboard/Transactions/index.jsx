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
  IconButton,
  FormControlLabel,
  Switch
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(5);
  const [total, setTotal] = useState(0);
  const [showPackage, setShowPackage] = useState(false);
  
  const householdId = 1; // TODO: get household id from context

  const fetchTransactions = () => {
    setLoading(true);
    fetch(`/api/transactions/${householdId}?page=${page - 1}&limit=${rowsPerPage}`)
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
    if (page === 1) {
      fetchTransactions();
    }
    else {
      setPage(1);
    }
  };

  const displayQty = (QtyInTotal,QtyPerPackage,PackageLabel,BaseUnitAbbr) => {
    if(showPackage){
      if(QtyInTotal % QtyPerPackage === 0)
        return `${Math.round(QtyInTotal / QtyPerPackage)} ${PackageLabel}${QtyInTotal / QtyPerPackage > 1 ? "s":""}`
      else return `${Math.round(QtyInTotal)}/${Math.round(QtyPerPackage)} ${PackageLabel}`
    } 
    else{
      return `${Math.round(QtyInTotal)}${BaseUnitAbbr}`
    }
  }

  return (
    <div className='transactionsContainer'>
      <Box display="flex" alignItems="center" gap={1} maxHeight='5vh'>
        <h1>Transactions</h1>
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
                    {tx.UserName} {tx.TransactionType}{tx.TransactionType === 'add' ? 'ed':'d'}{" "}
                    {displayQty(tx.QtyInTotal,tx.QtyPerPackage,tx.PackageLabel,tx.BaseUnitAbbr)} of {tx.FoodName} at {tx.LocationName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', ml: 2 }}>
                    {new Date(tx.CreatedAt).toLocaleString()}
                  </Typography>
                </ListItem>
                {index < transactions.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
          <Box display="flex" justifyContent="space-between" mt={0} pt={1} sx={{maxHeight: '8px', borderTop: 1, borderColor: 'divider'}}>
            <FormControlLabel 
              control={
                <Switch 
                  checked={showPackage} 
                  onChange={(e) => setShowPackage(e.target.checked)}
                  size="small"
                />
              }
              label={<Typography variant="caption">Show in Package</Typography>}
              sx={{ ml: 1, mt: 0.5, pt: 1 }}
            />
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

export default Transactions;