import { createContext, useState, useContext, useEffect, useCallback } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Cargamos inicial desde localStorage (esto es síncrono y suficiente)
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [usuario, setUsuario] = useState(() => {
    const s = localStorage.getItem('usuario');
    return s ? JSON.parse(s) : null;
  });
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Marcamos listo en el primer render (ya tenemos lo de localStorage arriba)
  useEffect(() => {
    setIsAuthReady(true);
  }, []);

  // Persistir token
  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  // Persistir usuario
  useEffect(() => {
    if (usuario) localStorage.setItem('usuario', JSON.stringify(usuario));
    else localStorage.removeItem('usuario');
  }, [usuario]);

  // Helper para setear ambos tras login
  const loginSuccess = useCallback((t, u) => {
    setToken(t);
    setUsuario(u);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUsuario(null);
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    // Limpieza extra opcional
    localStorage.removeItem('role');
    localStorage.removeItem('permisos');
    localStorage.removeItem('fullname');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('computer_name');
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, setUsuario, token, setToken, loginSuccess, logout, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
