// auth.js — JWT Auth Guard for Bustler Pulse

function checkAuth() {
  const token = sessionStorage.getItem('bp_token');
  if (!token) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function getUser() {
  return sessionStorage.getItem('bp_user') || 'Ops Agent';
}

function logout() {
  sessionStorage.removeItem('bp_token');
  sessionStorage.removeItem('bp_user');
  window.location.href = 'login.html';
}