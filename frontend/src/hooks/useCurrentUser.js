import { useQuery } from '@tanstack/react-query';

export const CURRENT_USER_QUERY_KEY = ['currentUser'];

const fetchCurrentUser = async () => {
  try {
    const res = await fetch('/api/auth/session', {
      credentials: 'include',
    });

    if (res.status === 401) {
      return null;
    }

    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message = payload?.error || 'Unable to restore session';
      throw new Error(message);
    }

    return payload?.user ?? null;
  } catch (error) {
    if (error?.message === 'Failed to fetch') {
      throw new Error('Unable to reach the server');
    }
    throw error;
  }
};

export const useCurrentUser = () => {
  const query = useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: fetchCurrentUser,
    staleTime: 0,
    retry: false,
  });

  const user = query.data ?? null;

  return {
    user,
    householdId: user?.household_id ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refreshUser: query.refetch,
    queryResult: query,
  };
};

