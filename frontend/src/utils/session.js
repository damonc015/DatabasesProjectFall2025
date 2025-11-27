export async function restoreSessionFromCookie() {
  try {
    const res = await fetch('/api/auth/session', { credentials: 'include' });
    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (data?.user) {
      localStorage.setItem('user', JSON.stringify(data));
      return data.user;
    }
  } catch (err) {
    return null;
  }

  return null;
}
