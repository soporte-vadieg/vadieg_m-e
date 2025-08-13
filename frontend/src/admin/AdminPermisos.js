import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const PERMISOS_DISPONIBLES = [
  'orden-servicio',
  'maquinista',
  'reportes',
  'admin' // si usás role + permisos, podés mantener admin sólo como role
];

export default function AdminPermisos() {
  const { token } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  const [sel, setSel] = useState(null); // usuario seleccionado para editar

  const auth = { Authorization: `Bearer ${token}` };
  const headers = { 'Content-Type':'application/json', ...auth };

  const load = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/usuarios/lista`, { headers: auth });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error listando usuarios');
      // normalizo permisos array
      const norm = (data || []).map(u => ({
        ...u,
        permisos: Array.isArray(u.permisos)
          ? u.permisos
          : (typeof u.permisos === 'string' ? u.permisos.split(',').map(s=>s.trim()).filter(Boolean) : [])
      }));
      setUsuarios(norm);
    } catch (e) { console.error(e); setMsg('❌ No se pudieron cargar los usuarios'); }
  };
  useEffect(()=>{ load(); }, []); // eslint-disable-line

  const filtrados = useMemo(()=>{
    const t = q.toLowerCase();
    return usuarios.filter(u =>
      !t ||
      (u.full_name||'').toLowerCase().includes(t) ||
      (u.username||'').toLowerCase().includes(t) ||
      (u.email||'').toLowerCase().includes(t)
    );
  }, [usuarios, q]);

  const togglePermiso = (perm) => {
    if (!sel) return;
    const has = sel.permisos.includes(perm);
    const next = has ? sel.permisos.filter(p=>p!==perm) : [...sel.permisos, perm];
    setSel({ ...sel, permisos: next });
  };

  const guardar = async () => {
    if (!sel) return;
    try {
      const body = JSON.stringify({ role: sel.role, permisos: sel.permisos });
      const res = await fetch(`${process.env.REACT_APP_API_URL}/usuarios/${sel.id}`, {
        method:'PUT', headers, body
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Error al actualizar');
      setSel(null);
      await load();
      setMsg('✅ Usuario actualizado');
    } catch (e) { console.error(e); setMsg(`❌ ${e.message}`); }
  };

  return (
    <div>
      <h4>🔐 Permisos</h4>

      <div className="card p-3 mb-3">
        <div className="row g-2">
          <div className="col-12 col-md-6">
            <input className="form-control" placeholder="Buscar por nombre, usuario o email…" value={q} onChange={e=>setQ(e.target.value)} />
          </div>
        </div>
      </div>

      {msg && <div className="alert alert-info">{msg}</div>}

      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-dark">
            <tr><th>ID</th><th>Nombre</th><th>Usuario</th><th>Email</th><th>Rol</th><th>Permisos</th><th style={{width:120}}>Acciones</th></tr>
          </thead>
          <tbody>
            {filtrados.map(u=>(
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.full_name}</td>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td><span className="badge bg-secondary">{u.role}</span></td>
                <td style={{maxWidth:340}}><small>{u.permisos.join(', ') || '—'}</small></td>
                <td>
                  <button className="btn btn-sm btn-outline-primary" onClick={()=>setSel(u)}>Editar</button>
                </td>
              </tr>
            ))}
            {filtrados.length===0 && <tr><td colSpan="7" className="text-center">Sin resultados</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modal edición */}
      {sel && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg"><div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Editar permisos — {sel.full_name}</h5>
              <button className="btn-close" onClick={()=>setSel(null)}></button>
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <label>Rol</label>
                  <select className="form-select" value={sel.role} onChange={e=>setSel({...sel, role:e.target.value})}>
                    <option value="user">Usuario</option>
                    <option value="maquinista">Maquinista</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="mb-2 d-block">Permisos</label>
                  <div className="d-flex flex-wrap gap-3">
                    {PERMISOS_DISPONIBLES.map(p=>(
                      <div className="form-check" key={p}>
                        <input className="form-check-input" type="checkbox" id={`perm-${p}`}
                          checked={sel.permisos.includes(p)} onChange={()=>togglePermiso(p)} />
                        <label className="form-check-label" htmlFor={`perm-${p}`}>{p}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setSel(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardar}>Guardar</button>
            </div>
          </div></div>
        </div>
      )}
    </div>
  );
}
