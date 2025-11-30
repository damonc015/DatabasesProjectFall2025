import { useEffect, useMemo, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

const initialState = { name: '', loading: false, error: '' };

const getEndpoint = ({ householdId, target, mode }) => {
  if (!householdId) {
    throw new Error('Missing household information.');
  }
  if (mode === 'rename') {
    if (!target?.LocationID) {
      throw new Error('Missing location information.');
    }
    return `/api/households/${householdId}/locations/${target.LocationID}`;
  }
  return `/api/households/${householdId}/locations`;
};

const getMethod = (mode) => (mode === 'rename' ? 'PUT' : 'POST');

const LocationModal = ({
  open,
  mode = 'add',
  householdId,
  targetLocation = null,
  onClose,
  onSuccess,
}) => {
  const [state, setState] = useState(initialState);

  const title = useMemo(() => (mode === 'rename' ? 'Rename Location' : 'Add Location'), [mode]);
  const confirmLabel = mode === 'rename' ? 'Save' : 'Add';

  useEffect(() => {
    if (!open) {
      setState(initialState);
      return;
    }
    setState({
      name: targetLocation?.LocationName || '',
      loading: false,
      error: '',
    });
  }, [open, targetLocation]);

  const handleClose = () => {
    if (state.loading) return;
    setState(initialState);
    onClose?.();
  };

  const handleSubmit = async () => {
    if (state.loading) return;
    if (!householdId) {
      setState((prev) => ({ ...prev, error: 'Missing household information.' }));
      return;
    }
    const trimmed = state.name.trim();
    if (!trimmed) {
      setState((prev) => ({ ...prev, error: 'Please enter a location name.' }));
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: '' }));

    try {
      const endpoint = getEndpoint({ householdId, target: targetLocation, mode });
      const response = await fetch(endpoint, {
        method: getMethod(mode),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ location_name: trimmed }),
      });
      if (!response.ok) {
        let message = mode === 'rename' ? 'Could not rename location.' : 'Could not create location.';
        try {
          const errorPayload = await response.json();
          if (errorPayload?.error) {
            message = errorPayload.error;
          }
        } catch (err) {
          console.error('Error parsing location error response:', err);
        }
        throw new Error(message);
      }

      const result = await response.json();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('locationCreated', { detail: result }));
      }
      onSuccess?.(result);
      setState(initialState);
    } catch (err) {
      setState((prev) => ({ ...prev, loading: false, error: err.message || 'Unable to save location.' }));
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        <TextField
          autoFocus
          label="Location name"
          value={state.name}
          onChange={(e) => {
            const value = e.target.value;
            setState((prev) => ({ ...prev, name: value, error: '' }));
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="e.g., Pantry, Freezer"
        />
        {state.error && (
          <Typography variant="body2" color="error">
            {state.error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={state.loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={state.loading}>
          {state.loading ? 'Saving...' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocationModal;


