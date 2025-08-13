// src/admin/AdminUsuarios.jsx
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminUsuarios() {
  const { token } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [q, setQ] = useState('');
  const [rol, setRol] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/usuarios/lista`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al listar usuarios');
        setUsuarios(data);
      } catch (e) {
        console.error(e);
        setMensaje('❌ No se pudo cargar la lista de usuarios');
      }
    };
    load();
  }, [token]);

  const filtrados = useMemo(() => {
    const term = q.toLowerCase();
    return usuarios.filter(u => {
      const byRol = !rol || u.role === rol;
      const byText =
        !term ||
        (u.full_name || '').toLowerCase().includes(term) ||
        (u.username || '').toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term);
      return byRol && byText;
    });
  }, [usuarios, q, rol]);

  return (
    <div>
      <h4 className="mb-3">👥 Usuarios</h4>

      {/* filtros */}
      <div className="card p-3 mb-3">
        <div className="row g-2">
          <div className="col-12 col-md-6">
            <input
              className="form-control"
              placeholder="Buscar por nombre, usuario o email…"
              value={q}
              onChange={e=>setQ(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-3">
            <select className="form-select" value={rol} onChange={e=>setRol(e.target.value)}>
              <option value="">Todos los roles</option>
              <option value="admin">Admin</option>
              <option value="user">Usuario</option>
              <option value="maquinista">Maquinista</option>
            </select>
          </div>
          <div className="col-12 col-md-3 d-flex gap-2">
            <button className="btn btn-outline-secondary w-100" onClick={()=>{setQ(''); setRol('');}}>
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {mensaje && <div className="alert alert-warning">{mensaje}</div>}

      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Permisos</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.full_name}</td>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td><span className="badge bg-secondary">{u.role}</span></td>
                <td style={{maxWidth: 320}}>
                  <small className="text-muted">
                    {Array.isArray(u.permisos) ? u.permisos.join(', ') : (u.permisos || '—')}
                  </small>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr><td colSpan={6} className="text-center">Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
