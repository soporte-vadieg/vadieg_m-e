// src/utils/apiFetch.js
export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('token'); // rápido y simple
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return fetch(url, { ...options, headers, cache: 'no-store' });
}
