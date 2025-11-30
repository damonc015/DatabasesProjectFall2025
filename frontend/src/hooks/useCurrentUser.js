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

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const message = err?.error || 'Unable to restore session';
      throw new Error(message);
    }

    return res.json();
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

  const user = query.data?.user ?? null;

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

