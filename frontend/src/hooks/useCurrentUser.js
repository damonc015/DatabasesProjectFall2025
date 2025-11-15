export const useCurrentUser = () => {
  const stored = JSON.parse(localStorage.getItem('user'));
  const user = stored?.user || null;

  return {
    user,
    householdId: user?.household_id,
  };
};

