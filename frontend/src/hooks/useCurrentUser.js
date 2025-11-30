import { useEffect, useState } from 'react';
import { getCachedUser, restoreSessionFromCookie, subscribeToSession } from '../utils/session';

export const useCurrentUser = () => {
  const [user, setUser] = useState(() => getCachedUser());
  const [loading, setLoading] = useState(!getCachedUser());
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      restoreSessionFromCookie()
        .then((restored) => {
          if (cancelled) return;
          setUser(restored);
          setError(restored ? null : new Error('Not authenticated'));
          setLoading(false);
        })
        .catch((err) => {
          if (cancelled) return;
          setError(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }

    const cleanupSession = subscribeToSession((nextUser) => {
      if (cancelled) return;
      setUser(nextUser);
      setError(nextUser ? null : new Error('Not authenticated'));
      setLoading(false);
    });

    return () => {
      cancelled = true;
      cleanupSession();
    };
  }, []);

  return {
    user,
    householdId: user?.household_id,
    loading,
    error,
  };
};