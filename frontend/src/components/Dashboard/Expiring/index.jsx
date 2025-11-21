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

const Expiring = ({ showPackage }) => {
  const [expiring, setExpiring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(5);
  const [total, setTotal] = useState(0);

  const user = useCurrentUser();

  const fetchExpiring = () => {
    fetch(`/api/transactions/expiring/${user.householdId}?page=${page - 1}&limit=${rowsPerPage}`)
      .then(res => res.json())
      .then(result => {
        setExpiring(result.data);
        setTotal(result.total);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error:', error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchExpiring();

    // Set up interval to refresh data every 3 seconds
    const intervalId = setInterval(() => {
      fetchExpiring();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [page, rowsPerPage, user.householdId]);

  const handleChangePage = (event, value) => {
    setPage(value);
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
      </Box>
      <Card className='cardContainer' variant='outlined'>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', p: 1 }}>
          <Box sx={{ flex: 1 }}>
            <List dense disablePadding>
              {[...Array(rowsPerPage)].map((_, index) => {
                const tx = expiring[index];
                return (
                  <React.Fragment key={index}>
                    <ListItem sx={{ py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '40px' }}>
                      {tx ? (
                        <Typography variant="body2" fontWeight="bold" sx={{ flex: 1, whiteSpace: 'nowrap' }}>
                          {showPackage ? tx.FormattedPackages : `${Math.round(tx.QtyInTotal)}${tx.BaseUnitAbbr}`} of {tx.FoodName} at {tx.LocationName} will expire in {computeDateDiff(tx.ExpirationDate)}
                        </Typography>
                      ) : (
                        index === 0 && expiring.length === 0 && !loading ? (
                          <Typography variant="body2" color="text.secondary">
                            No expiring items
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

export default Expiring;
