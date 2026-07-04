export function getToken() {
  return sessionStorage.getItem('bp_token');
}

export function getUser() {
  return sessionStorage.getItem('bp_user') || 'Ops Agent';
}

export function isLoggedIn() {
  return !!getToken();
}

export function logout() {
  sessionStorage.removeItem('bp_token');
  sessionStorage.removeItem('bp_user');
  window.location.href = '/login';
}

export async function loginUser(username, password) {
  const res = await fetch('https://bustler-pulse.onrender.com/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error('Invalid credentials');
  const data = await res.json();
  const token = data.access_token || data.token;
  sessionStorage.setItem('bp_token', token);
  sessionStorage.setItem('bp_user', username);
  return token;
}