import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminObras() {
  const { token } = useAuth();
  const [obras, setObras] = useState([]);
  const [q, setQ] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ id:null, codigo:'', nombre:'' });
  const isEdit = form.id != null;

  const headers = { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` };

  const load = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/obras`, { headers: { Authorization: headers.Authorization }});
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al listar obras');
      // normalizo claves esperadas
      const norm = (data || []).map(o => ({
        id: o.id,
        codigo: o.codigo ?? o.cod ?? '',
        nombre: o.nombre ?? o.nombre_obra ?? ''
      }));
      setObras(norm);
    } catch (e) {
      console.error(e);
      setMensaje('❌ No se pudieron cargar las obras');
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const filtradas = useMemo(() => {
    const term = q.toLowerCase();
    return obras.filter(o =>
      !term ||
      (o.codigo || '').toLowerCase().includes(term) ||
      (o.nombre || '').toLowerCase().includes(term)
    );
  }, [obras, q]);

  const abrirNueva = () => { setForm({ id:null, codigo:'', nombre:'' }); setModalOpen(true); };
  const abrirEditar = (o) => { setForm(o); setModalOpen(true); };

  const guardar = async () => {
    try {
      const body = JSON.stringify({ codigo: form.codigo, nombre: form.nombre });
      const url = `${process.env.REACT_APP_API_URL}/obras` + (isEdit ? `/${form.id}` : '');
      const res = await fetch(url, { method: isEdit ? 'PUT':'POST', headers, body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      setModalOpen(false);
      await load();
      setMensaje('✅ Obra guardada');
    } catch (e) {
      console.error(e);
      setMensaje(`❌ ${e.message}`);
    }
  };

  const borrar = async (id) => {
    if (!window.confirm('¿Eliminar esta obra?')) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/obras/${id}`, { method:'DELETE', headers: { Authorization: headers.Authorization }});
      if (!res.ok) {
        const d = await res.json().catch(()=> ({}));
        throw new Error(d.error || 'Error al eliminar');
      }
      await load();
      setMensaje('🗑️ Obra eliminada');
    } catch (e) {
      console.error(e);
      setMensaje(`❌ ${e.message}`);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>🏗️ Obras</h4>
        <button className="btn btn-primary" onClick={abrirNueva}>➕ Nueva</button>
      </div>

      <div className="card p-3 mb-3">
        <div className="row g-2">
          <div className="col-12 col-md-6">
            <input className="form-control" placeholder="Buscar por código o nombre…" value={q} onChange={e=>setQ(e.target.value)} />
          </div>
          <div className="col-12 col-md-3">
            <button className="btn btn-outline-secondary w-100" onClick={()=>setQ('')}>Limpiar</button>
          </div>
        </div>
      </div>

      {mensaje && <div className="alert alert-info">{mensaje}</div>}

      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-dark">
            <tr><th>ID</th><th>Código</th><th>Nombre</th><th style={{width:140}}>Acciones</th></tr>
          </thead>
          <tbody>
            {filtradas.map(o=>(
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{o.codigo}</td>
                <td>{o.nombre}</td>
                <td className="d-flex gap-2">
                  <button className="btn btn-sm btn-outline-primary" onClick={()=>abrirEditar(o)}>Editar</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={()=>borrar(o.id)}>Borrar</button>
                </td>
              </tr>
            ))}
            {filtradas.length===0 && <tr><td colSpan="4" className="text-center">Sin resultados</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header"><h5 className="modal-title">{isEdit? 'Editar obra':'Nueva obra'}</h5>
                <button className="btn-close" onClick={()=>setModalOpen(false)}></button></div>
              <div className="modal-body">
                <div className="mb-3">
                  <label>Código</label>
                  <input className="form-control" value={form.codigo} onChange={e=>setForm({...form, codigo:e.target.value})}/>
                </div>
                <div className="mb-3">
                  <label>Nombre</label>
                  <input className="form-control" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})}/>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={()=>setModalOpen(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={guardar}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
