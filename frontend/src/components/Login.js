import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);

  const { setUsuario, setToken, loginSuccess } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setMensaje('Verificando...');

    try {
      const API = (process.env.REACT_APP_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMensaje(`❌ ${data?.error || 'Credenciales inválidas'}`);
        setLoading(false);
        return;
      }

      // ✅ El backend envía { token, usuario }
      const { token, usuario } = data;

      // Guardar en contexto (AuthContext ya persiste en localStorage)
      if (typeof loginSuccess === 'function') {
        loginSuccess(token, usuario);
      } else {
        setToken(token);
        setUsuario(usuario);
      }

      setMensaje('✅ Login exitoso');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error(error);
      setMensaje('❌ Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Usuario:
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            autoFocus
            disabled={loading}
          />
        </label><br/><br/>
        <label>
          Contraseña:
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </label><br/><br/>
        <button type="submit" disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
      <p>{mensaje}</p>
    </div>
  );
}
