import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ListaUsuarios() {
  const { token } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [mensaje, setMensaje] = useState('');

  const fetchUsuarios = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/usuarios/lista`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsuarios(data);
    } catch (error) {
      console.error(error);
      setMensaje('❌ Error al obtener los usuarios');
    }
  }, [token]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const handleRolChange = async (id, nuevoRol) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/usuarios/${id}/rol`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: nuevoRol })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      fetchUsuarios();
    } catch (error) {
      console.error(error);
      alert('❌ No se pudo actualizar el rol.');
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Lista de Usuarios</h2>
      {mensaje && <div className="alert alert-danger">{mensaje}</div>}
      {usuarios.length === 0 ? (
        <p className="text-center">No hay usuarios registrados.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-hover shadow-sm">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Nombre completo</th>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td>{usuario.id}</td>
                  <td>{usuario.full_name}</td>
                  <td>{usuario.username}</td>
                  <td>{usuario.email}</td>
                  <td>
                    <select
                      className={`form-select form-select-sm ${
                        usuario.role === 'admin' ? 'bg-danger text-white' :
                        usuario.role === 'user' ? 'bg-info text-dark' :
                        'bg-secondary text-white'
                      }`}
                      value={usuario.role}
                      onChange={(e) => handleRolChange(usuario.id, e.target.value)}
                    >
                      <option value="admin">Admin</option>
                      <option value="user">User</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
