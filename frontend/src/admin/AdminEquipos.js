import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminEquipos() {
  const { token } = useAuth();
  const [equipos, setEquipos] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [q, setQ] = useState('');
  const [tipo, setTipo] = useState('');
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id:null, nombre_equipo:'', tipo:'', descripcion:'' });
  const isEdit = form.id != null;

  const auth = { Authorization: `Bearer ${token}` };
  const headers = { 'Content-Type':'application/json', ...auth };

  const load = async () => {
    try {
      const [re, rt] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL}/equipos`, { headers: auth }),
        fetch(`${process.env.REACT_APP_API_URL}/equipos/tipos`, { headers: auth }).catch(()=> null),
      ]);
      const de = await re.json();
      const dt = rt ? await rt.json() : [];
      if (!re.ok) throw new Error(de.error || 'Error listando equipos');
      setEquipos(de || []);
      setTipos(Array.isArray(dt)? dt : []);
    } catch (e) {
      console.error(e); setMsg('❌ No se pudieron cargar los equipos');
    }
  };
  useEffect(()=> { load(); }, []); // eslint-disable-line

  const filtrados = useMemo(()=>{
    const t = q.toLowerCase();
    return equipos.filter(e => {
      const okTipo = !tipo || e.tipo === tipo;
      const okText = !t || (e.nombre_equipo||'').toLowerCase().includes(t) || (e.descripcion||'').toLowerCase().includes(t);
      return okTipo && okText;
    });
  }, [equipos, q, tipo]);

  const abrirNueva = () => { setForm({ id:null, nombre_equipo:'', tipo:'', descripcion:'' }); setOpen(true); };
  const abrirEditar = (e) => { setForm(e); setOpen(true); };

  const guardar = async () => {
    try {
      const url = `${process.env.REACT_APP_API_URL}/equipos` + (isEdit? `/${form.id}`:'');
      const res = await fetch(url, { method: isEdit?'PUT':'POST', headers, body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Error al guardar');
      setOpen(false); await load(); setMsg('✅ Equipo guardado');
    } catch (e) { console.error(e); setMsg(`❌ ${e.message}`); }
  };

  const borrar = async (id) => {
    if (!window.confirm('¿Eliminar equipo?')) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/equipos/${id}`, { method:'DELETE', headers: auth });
      if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || 'Error al eliminar');
      await load(); setMsg('🗑️ Equipo eliminado');
    } catch (e) { console.error(e); setMsg(`❌ ${e.message}`); }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>🚜 Equipos</h4>
        <button className="btn btn-primary" onClick={abrirNueva}>➕ Nuevo</button>
      </div>

      <div className="card p-3 mb-3">
        <div className="row g-2">
          <div className="col-12 col-md-5">
            <input className="form-control" placeholder="Buscar por nombre o descripción…" value={q} onChange={e=>setQ(e.target.value)} />
          </div>
          <div className="col-12 col-md-4">
            <select className="form-select" value={tipo} onChange={e=>setTipo(e.target.value)}>
              <option value="">Todos los tipos</option>
              {tipos.map(t=> <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-3 d-flex gap-2">
            <button className="btn btn-outline-secondary w-100" onClick={()=>{ setQ(''); setTipo(''); }}>Limpiar</button>
          </div>
        </div>
      </div>

      {msg && <div className="alert alert-info">{msg}</div>}

      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-dark">
            <tr><th>ID</th><th>Nombre</th><th>Tipo</th><th>Descripción</th><th style={{width:160}}>Acciones</th></tr>
          </thead>
          <tbody>
            {filtrados.map(e=>(
              <tr key={e.id}>
                <td>{e.id}</td>
                <td>{e.nombre_equipo}</td>
                <td><span className="badge bg-secondary">{e.tipo || '—'}</span></td>
                <td style={{maxWidth:420}}><small>{e.descripcion}</small></td>
                <td className="d-flex gap-2">
                  <button className="btn btn-sm btn-outline-primary" onClick={()=>abrirEditar(e)}>Editar</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={()=>borrar(e.id)}>Borrar</button>
                </td>
              </tr>
            ))}
            {filtrados.length===0 && <tr><td colSpan="5" className="text-center">Sin resultados</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {open && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog"><div className="modal-content">
            <div className="modal-header"><h5 className="modal-title">{isEdit? 'Editar equipo':'Nuevo equipo'}</h5>
              <button className="btn-close" onClick={()=>setOpen(false)}></button></div>
            <div className="modal-body">
              <div className="row g-2">
                <div className="col-12 col-md-6">
                  <label>Nombre</label>
                  <input className="form-control" value={form.nombre_equipo} onChange={e=>setForm({...form, nombre_equipo:e.target.value})}/>
                </div>
                <div className="col-12 col-md-6">
                  <label>Tipo</label>
                  <input className="form-control" value={form.tipo||''} onChange={e=>setForm({...form, tipo:e.target.value})}/>
                </div>
                <div className="col-12">
                  <label>Descripción</label>
                  <textarea className="form-control" value={form.descripcion||''} onChange={e=>setForm({...form, descripcion:e.target.value})}/>
                </div>
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
