let cachedUser = null;
let activeSessionRequest = null;
const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => {
    try {
      listener(cachedUser);
    } catch (err) {
    }
  });
};

export const subscribeToSession = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getCachedUser = () => cachedUser;

export const setSessionUser = (user) => {
  cachedUser = user || null;
  notify();
};

export const clearCachedUser = () => {
  cachedUser = null;
  notify();
};

export async function restoreSessionFromCookie({ force = false } = {}) {
  if (cachedUser && !force) {
    return cachedUser;
  }

  if (!activeSessionRequest) {
    activeSessionRequest = fetch('/api/auth/session', {
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) {
          return null;
        }
        const data = await res.json();
        return data?.user || null;
      })
      .catch(() => null)
      .finally(() => {
        activeSessionRequest = null;
      });
  }

  const user = await activeSessionRequest;
  setSessionUser(user);
  return user;
}

export async function logoutSession() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } finally {
    clearCachedUser();
  }
}
