import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../api/auth';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const navigate = useNavigate();
  const { setUsuario, setToken } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('Verificando...');

    try {
      const { token, user } = await login(username, password);
      setToken(token);
      setUsuario(user);
      setMensaje('✅ Login exitoso');

      const permisos = user.permisos || [];
      const rol = user.role || '';

      // 👇 Lógica de redirección según rol/permisos
      if (rol === 'admin') {
        navigate('/dashboard');
      } else if (permisos.includes('maquinista')) {
        navigate('/partes/nuevo');
      } else if (permisos.includes('orden-servicio')) {
        navigate('/ordenes/nueva');
      } 
         else {
        navigate('/');
      }

    } catch (error) {
      setMensaje(`❌ ${error.message}`);
    }
  };

  return (
    <div className="container mt-5">
      <div className="card shadow p-4" style={{ maxWidth: '500px', margin: 'auto' }}>
        <h2 className="text-center mb-4">Iniciar Sesión</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Usuario</label>
            <input
              className="form-control"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-primary w-100" type="submit">Ingresar</button>
        </form>
        {mensaje && <p className="mt-3 text-center text-danger">{mensaje}</p>}
      </div>
    </div>
  );
}
