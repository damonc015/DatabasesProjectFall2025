import { useCallback, useState } from 'react';

const initialAddState = { open: false, name: '', loading: false, error: '' };
const initialRenameState = { open: false, name: '', loading: false, error: '', target: null };

export const useLocationModals = ({ householdId, refreshLocations }) => {
  const [addModal, setAddModal] = useState(initialAddState);
  const [renameModal, setRenameModal] = useState(initialRenameState);

  const openAddModal = useCallback(() => {
    setAddModal({ ...initialAddState, open: true });
  }, []);

  const closeAddModal = useCallback(() => {
    setAddModal((prev) => (prev.loading ? prev : initialAddState));
  }, []);

  const updateAddName = useCallback((value) => {
    setAddModal((prev) => ({ ...prev, name: value, error: '' }));
  }, []);

  const saveAddLocation = useCallback(async () => {
    if (!householdId) {
      setAddModal((prev) => ({ ...prev, error: 'Missing household information.' }));
      return null;
    }

    const trimmed = addModal.name.trim();
    if (!trimmed) {
      setAddModal((prev) => ({ ...prev, error: 'Please enter a location name.' }));
      return null;
    }

    setAddModal((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const response = await fetch(`http://localhost:5001/api/households/${householdId}/locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location_name: trimmed }),
      });

      if (!response.ok) {
        let message = 'Could not create location.';
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

      const newLocation = await response.json();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('locationCreated', { detail: newLocation }));
      }
      await refreshLocations?.();
      setAddModal(initialAddState);
      return newLocation;
    } catch (err) {
      setAddModal((prev) => ({
        ...prev,
        loading: false,
        error: err.message || 'Unable to create location.',
      }));
      return null;
    }
  }, [addModal.name, householdId, refreshLocations]);

  const openRenameModal = useCallback((location) => {
    if (!location) return;
    setRenameModal({
      ...initialRenameState,
      open: true,
      target: location,
      name: location.LocationName || '',
    });
  }, []);

  const closeRenameModal = useCallback(() => {
    setRenameModal((prev) => (prev.loading ? prev : initialRenameState));
  }, []);

  const updateRenameName = useCallback((value) => {
    setRenameModal((prev) => ({ ...prev, name: value, error: '' }));
  }, []);

  const saveRenamedLocation = useCallback(async () => {
    if (!householdId || !renameModal.target) {
      setRenameModal((prev) => ({
        ...prev,
        error: 'Missing location information.',
      }));
      return null;
    }

    const trimmed = renameModal.name.trim();
    if (!trimmed) {
      setRenameModal((prev) => ({ ...prev, error: 'Please enter a location name.' }));
      return null;
    }

    setRenameModal((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const response = await fetch(
        `http://localhost:5001/api/households/${householdId}/locations/${renameModal.target.LocationID}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ location_name: trimmed }),
        }
      );

      if (!response.ok) {
        let message = 'Could not rename location.';
        try {
          const errorPayload = await response.json();
          if (errorPayload?.error) {
            message = errorPayload.error;
          }
        } catch (err) {
          console.error('Error parsing rename response:', err);
        }
        throw new Error(message);
      }

      const updatedLocation = await response.json();
      await refreshLocations?.();
      setRenameModal(initialRenameState);
      return updatedLocation;
    } catch (err) {
      setRenameModal((prev) => ({
        ...prev,
        loading: false,
        error: err.message || 'Unable to rename location.',
      }));
      return null;
    }
  }, [householdId, refreshLocations, renameModal.name, renameModal.target]);

  return {
    addModal,
    renameModal,
    openAddModal,
    closeAddModal,
    updateAddName,
    saveAddLocation,
    openRenameModal,
    closeRenameModal,
    updateRenameName,
    saveRenamedLocation,
  };
};


