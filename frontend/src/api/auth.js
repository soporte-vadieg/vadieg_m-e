// src/api/auth.js

export const login = async (username, password) => {
  const res = await fetch(`${process.env.REACT_APP_API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.error || 'Credenciales inválidas');

  // ✅ Guardar token en localStorage
  localStorage.setItem('token', data.token);
  localStorage.setItem('usuario', JSON.stringify(data.user));

  return { token: data.token, user: data.user };
};
