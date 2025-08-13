import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminTareas() {
  const { token } = useAuth();
  const [tareas, setTareas] = useState([]);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id:null, nombre:'', descripcion:'' });
  const isEdit = form.id != null;

  const auth = { Authorization: `Bearer ${token}` };
  const headers = { 'Content-Type':'application/json', ...auth };

  const load = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/tareas`, { headers: auth });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error listando tareas');
      setTareas(data || []);
    } catch (e) { console.error(e); setMsg('❌ No se pudieron cargar las tareas'); }
  };
  useEffect(()=>{ load(); }, []); // eslint-disable-line

  const filtradas = useMemo(()=>{
    const t = q.toLowerCase();
    return tareas.filter(x =>
      !t || (x.nombre||'').toLowerCase().includes(t) || (x.descripcion||'').toLowerCase().includes(t)
    );
  }, [tareas, q]);

  const nueva = () => { setForm({ id:null, nombre:'', descripcion:'' }); setOpen(true); };
  const editar = (x) => { setForm(x); setOpen(true); };

  const guardar = async () => {
    try {
      const url = `${process.env.REACT_APP_API_URL}/tareas` + (isEdit? `/${form.id}`:'');
      const res = await fetch(url, { method: isEdit?'PUT':'POST', headers, body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Error al guardar');
      setOpen(false); await load(); setMsg('✅ Tarea guardada');
    } catch (e) { console.error(e); setMsg(`❌ ${e.message}`); }
  };

  const borrar = async (id) => {
    if (!window.confirm('¿Eliminar tarea?')) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/tareas/${id}`, { method:'DELETE', headers: auth });
      if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || 'Error al eliminar');
      await load(); setMsg('🗑️ Tarea eliminada');
    } catch (e) { console.error(e); setMsg(`❌ ${e.message}`); }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>🧰 Tareas</h4>
        <button className="btn btn-primary" onClick={nueva}>➕ Nueva</button>
      </div>

      <div className="card p-3 mb-3">
        <div className="row g-2">
          <div className="col-12 col-md-6">
            <input className="form-control" placeholder="Buscar por nombre o descripción…" value={q} onChange={e=>setQ(e.target.value)} />
          </div>
          <div className="col-12 col-md-3">
            <button className="btn btn-outline-secondary w-100" onClick={()=>setQ('')}>Limpiar</button>
          </div>
        </div>
      </div>

      {msg && <div className="alert alert-info">{msg}</div>}

      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-dark">
            <tr><th>ID</th><th>Nombre</th><th>Descripción</th><th style={{width:150}}>Acciones</th></tr>
          </thead>
          <tbody>
            {filtradas.map(x=>(
              <tr key={x.id}>
                <td>{x.id}</td>
                <td>{x.nombre}</td>
                <td style={{maxWidth:500}}><small>{x.descripcion}</small></td>
                <td className="d-flex gap-2">
                  <button className="btn btn-sm btn-outline-primary" onClick={()=>editar(x)}>Editar</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={()=>borrar(x.id)}>Borrar</button>
                </td>
              </tr>
            ))}
            {filtradas.length===0 && <tr><td colSpan="4" className="text-center">Sin resultados</td></tr>}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog"><div className="modal-content">
            <div className="modal-header"><h5 className="modal-title">{isEdit?'Editar tarea':'Nueva tarea'}</h5>
              <button className="btn-close" onClick={()=>setOpen(false)}></button></div>
            <div className="modal-body">
              <div className="mb-3">
                <label>Nombre</label>
                <input className="form-control" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})}/>
              </div>
              <div className="mb-3">
                <label>Descripción</label>
                <textarea className="form-control" value={form.descripcion||''} onChange={e=>setForm({...form, descripcion:e.target.value})}/>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardar}>Guardar</button>
            </div>
          </div></div>
        </div>
      )}
    </div>
  );
}
